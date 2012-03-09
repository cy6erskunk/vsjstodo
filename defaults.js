/** 
 * Global namespace object XXX is created here
 * Also default settings are overwritted with localStorage ones, if present
 *
 * Each option consists of title, which is displayed at the options page
 * and value which can be string or object
 */
var XXX = {};

XXX.defaults = {
    bgColor : {
        title : 'Background color',
        value : 'fff'
    },
    importantStyle : {
        title : 'Select how important task should be displayed',
        value : {
            bold : true,
            red : false
        }
    }
  };

XXX.options = $.extend({}, XXX.defaults, localStorage.options);
