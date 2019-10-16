
/*
 * Get and set global vaiables
 */
var _global = {

}
export function setGlobal(updateGlobal) {
  _global = updateGlobal
}
export function getGlobal() {
  return _global
}

/*
 * Handle cookies
 */

export function setCookie (name, value, days) {
	if ( typeof document !== 'undefined' ) {	
	    var expires = "";
	    if (days) {
	        var date = new Date();
	        date.setTime(date.getTime() + (days*24*60*60*1000));
	        expires = "; expires=" + date.toUTCString();
	    }
	    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
	}
}
export function getCookie (name) {
	if ( typeof document !== 'undefined' ) {	
	    var nameEQ = name + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0;i < ca.length;i++) {
	        var c = ca[i];
	        while (c.charAt(0)===' ') c = c.substring(1,c.length);
	        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	    }
	    return null;
	}
}
export function eraseCookie (name) {   
	if ( typeof document !== 'undefined' ) {
    	document.cookie = name+'=; Max-Age=-99999999;';  
	}
}