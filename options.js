$(function () {
    /**
     * defaults.js should be executed before this file invocations as soon as
     * namespace object XXX is created there and populated with 'defaults' and
     * 'options' (that is defaults extended with localStorage values) 
     * properties
     */
    if (typeof(XXX) !== 'object') {
        XXX = {};
    }

    /**
     * @function
     *
     * Generates a list of inputs and radio buttons from options object
     * and binds events to update options object
     *
     * There're two possible type of options: String and Object
     * * if functions meets string then
     * <input type="text" id="%propertyName%"/>
     * is generated (where %propertyName% is the name of current element
     * * if object is met - set of radio buttons is generated and
     * the one corresponding to the property with boolean true value 
     * becomes checked(or the very first one)
     * Arrays are silently dropped
     * TODO: use mustache.js, Luke
     */
    var body = $('body');
    $.each(XXX.options, function (index, value) {
        console.log(typeof(value.value));
        // generate input
        if (typeof(value.value) === 'string') {
            body.append("<div><span>" + value.title +
                ": <input type='text' id='" + index + "' value='" + value.value + "'/></div>");
            return;
        }
        // generate radio buttons
        // TODO: check if there's no true
        // TODO: check if there's more than one true
        if (typeof(value.value === 'object')) {
            var html = "<div><span>" + value.title + "</span>";
            ($.each(value.value, function (innerIndex, innerValue) {
                html = html + "<label><input type='radio' name='" + 
                    index + "' " + (innerValue ? "checked='checked'" : "") + "/>" +
                    innerIndex + "</label>";
            }));
            html = html + "</div>";
            body.append(html);
        }
    });
});
