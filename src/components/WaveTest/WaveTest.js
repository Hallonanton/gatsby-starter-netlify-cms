import React, { Component } from 'react'
import styled from '@emotion/styled'

import * as THREE from 'three'
import OrbitControls from './vendors/OrbitControls'
import GPUComputationRenderer from './vendors/GPUComputationRenderer'
import HeightmapFragmentShader from './shaders/HeightmapFragmentShader'
import WaterVertexShader from './shaders/WaterVertexShader'


/*==============================================================================
  # Styles
==============================================================================*/

const Wrapper = styled('div')`
  width: 100vw;
  height: 100vh;
`

/*==============================================================================
  # Component
==============================================================================*/

class WaveTest extends Component {

  componentDidMount(){

    // Texture width for simulation
    this.WIDTH = 128

    // Water size in system units
    this.BOUNDS = 512

    //Prepare variables
    this.mouseMoved = false
    this.mouseCoords = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.waterNormal = new THREE.Vector3()

    //Set eventlisteners
    document.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', this.onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', this.onDocumentTouchMove, false );
    window.addEventListener( 'resize', this.onWindowResize, false );

    //Start animatio
    this.init()
    this.animate()
  }

  componentWillUnmount (){
    //Remove eventlisteners
    document.removeEventListener( 'mousemove', this.onDocumentMouseMove, false );
    document.removeEventListener( 'touchstart', this.onDocumentTouchStart, false );
    document.removeEventListener( 'touchmove', this.onDocumentTouchMove, false );
    window.removeEventListener( 'resize', this.onWindowResize, false );
  }

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  setMouseCoords = ( x, y ) => {
    this.mouseCoords.set( ( x / this.renderer.domElement.clientWidth ) * 2 - 1, - ( y / this.renderer.domElement.clientHeight ) * 2 + 1 );
    this.mouseMoved = true;
  }

  onDocumentMouseMove = ( event ) => {
    this.setMouseCoords( event.clientX, event.clientY );
  }

  onDocumentTouchStart = ( event ) => {
    if ( event.touches.length === 1 ) {
      event.preventDefault();
      this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
    }
  }

  onDocumentTouchMove = ( event ) => {
    if ( event.touches.length === 1 ) {
      event.preventDefault();
      this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
    }
  }

  init = () => {

    //Scene
    this.scene = new THREE.Scene()


    //Light
    let sun = new THREE.DirectionalLight( '#FFFFFF', 1.0 )
    sun.position.set( 15, 50, 15 )
    this.scene.add( sun )


    //Render
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setPixelRatio( window.devicePixelRatio )
    this.renderer.setSize( window.innerWidth, window.innerHeight )
    this.mount.appendChild( this.renderer.domElement )


    //Camera
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 )
    this.camera.position.set( 0, 200, 350 )
    this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.cameraControls.minPolarAngle = 0
    this.cameraControls.maxPolarAngle = 0
    this.cameraControls.enabled = false
    this.cameraControls.update()


    //Init
    this.initWater()
  }

  initWater = () => {

    const materialColor = '#FFFFFF';

    const geometry = new THREE.PlaneBufferGeometry( this.BOUNDS, this.BOUNDS, this.WIDTH - 1, this.WIDTH - 1 );

    // material: make a THREE.ShaderMaterial clone of THREE.MeshPhongMaterial, with customized vertex shader
    let material = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.merge( [
        THREE.ShaderLib[ 'phong' ].uniforms,
        {
          "heightmap": { value: null }
        }
      ] ),
      vertexShader: WaterVertexShader.vertexShader,
      fragmentShader: THREE.ShaderChunk[ 'meshphong_frag' ]

    } );

    material.lights = true;

    // Material attributes from THREE.MeshPhongMaterial
    material.color = new THREE.Color( materialColor );
    material.specular = new THREE.Color( '#111111' );
    material.shininess = 50;

    // Sets the uniforms with the material values
    material.uniforms[ "diffuse" ].value = material.color;
    material.uniforms[ "specular" ].value = material.specular;
    material.uniforms[ "shininess" ].value = Math.max( material.shininess, 1e-4 );
    material.uniforms[ "opacity" ].value = material.opacity;

    // Defines
    material.defines.WIDTH = this.WIDTH.toFixed( 1 );
    material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

    this.waterUniforms = material.uniforms;

    this.waterMesh = new THREE.Mesh( geometry, material );
    this.waterMesh.rotation.x = - Math.PI / 2;
    this.waterMesh.matrixAutoUpdate = false;
    this.waterMesh.updateMatrix();

    this.scene.add( this.waterMesh );

    // THREE.Mesh just for mouse raycasting
    const geometryRay = new THREE.PlaneBufferGeometry( this.BOUNDS, this.BOUNDS, 1, 1 );
    this.meshRay = new THREE.Mesh( geometryRay, new THREE.MeshBasicMaterial( { color: '#FFFFFF', visible: false } ) );
    this.meshRay.rotation.x = - Math.PI / 2;
    this.meshRay.matrixAutoUpdate = false;
    this.meshRay.updateMatrix();
    this.scene.add( this.meshRay );


    // Creates the gpu computation class and sets it up

    this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

    const heightmap0 = this.gpuCompute.createTexture();

    this.heightmapVariable = this.gpuCompute.addVariable( "heightmap", HeightmapFragmentShader.fragmentShader, heightmap0 );

    this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );

    this.heightmapVariable.material.uniforms[ "mousePos" ] = { value: new THREE.Vector2( 10000, 10000 ) };
    this.heightmapVariable.material.uniforms[ "mouseSize" ] = { value: 20.0 };
    this.heightmapVariable.material.uniforms[ "viscosityConstant" ] = { value: 0.98 };
    this.heightmapVariable.material.uniforms[ "heightCompensation" ] = { value: 0 };
    this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

    const error = this.gpuCompute.init();
    if ( error !== null ) {
      console.error( error );
    }

    // Create compute shader to smooth the water surface and velocity
    /*
      this.smoothShader = this.gpuCompute.createShaderMaterial( document.getElementById( 'smoothFragmentShader' ).textContent, { smoothTexture: { value: null } } );
     */

    // Create compute shader to read water level
    /*
      readWaterLevelShader = gpuCompute.createShaderMaterial( document.getElementById( 'readWaterLevelFragmentShader' ).textContent, {
        point1: { value: new THREE.Vector2() },
        levelTexture: { value: null }
      } );
      readWaterLevelShader.defines.WIDTH = WIDTH.toFixed( 1 );
      readWaterLevelShader.defines.BOUNDS = BOUNDS.toFixed( 1 );
    */

    // Create a 4x1 pixel image and a render target (Uint8, 4 channels, 1 byte per channel) to read water height and orientation
    //readWaterLevelImage = new Uint8Array( 4 * 1 * 4 );

    /*readWaterLevelRenderTarget = new THREE.WebGLRenderTarget( 4, 1, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      stencilBuffer: false,
      depthBuffer: false
    } );*/
  }

  animate = () => {
    this.animationFrame = requestAnimationFrame( this.animate )
    this.renderScene()
  }

  stopAllAnimation = () => {
    cancelAnimationFrame( this.animationFrame )
  }

  renderScene = () => {
    // Set uniforms: mouse interaction
    let uniforms = this.heightmapVariable.material.uniforms

    if ( this.mouseMoved ) {

      this.raycaster.setFromCamera( this.mouseCoords, this.camera );

      const intersects = this.raycaster.intersectObject( this.meshRay );

      if ( intersects.length > 0 ) {

          const point = intersects[ 0 ].point;
          uniforms[ "mousePos" ].value.set( point.x, point.z );

      } else {

          uniforms[ "mousePos" ].value.set( 10000, 10000 );

      }

      this.mouseMoved = false;

    } else {

      uniforms[ "mousePos" ].value.set( 10000, 10000 );

    }

    // Do the gpu computation
    this.gpuCompute.compute();

    // Get compute output in custom uniform
    this.waterUniforms[ "heightmap" ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;

    // Render
    this.renderer.render( this.scene, this.camera );
  }

  render () {
    return <Wrapper ref={(mount) => { this.mount = mount }} />
  }
}

export default WaveTest