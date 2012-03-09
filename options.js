$(function () {
    /**
     * defaults.js should be executed before this file invocations as soon as
     * namespace object XXX is created there and populated with 'defaults' and
     * 'options' (that is defaults extended with localStorage values) 
     * properties
     *
     * handlebars templates are used to generate content so templte engine
     * should be included somewhere before this file
     * see https://github.com/wycats/handlebars.js/
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
     *
     * TODO: use pre-compiled templates and handlebars-runtime
     */
    var body = $('body'),
        stringSource = "<div><span>{{title}}: <input type='text' id='{{name}}' value='{{value}}'/></div>",
        radioSource = "<div><span>{{title}}: </span><ul>{{#options}}\
                <li><label><input type='radio' name='{{../name}}' {{#if checked}}checked='checked'{{/if}}/>{{title}}</label></li>\
                {{/options}}</ul></div>",
        stringTemplate = Handlebars.compile(stringSource),
        radioTemplate = Handlebars.compile(radioSource),
        data,
        trueOptionsCounter;

    $.each(XXX.options, function (index, value) {
        // generate input
        if (typeof(value.value) === 'string') {
            data = {
                title : value.title,
                name : index,
                value : value.value
            };
            body.append(stringTemplate(data));
        } else if (typeof(value.value === 'object')) {
            // generate radio buttons
            // TODO: check if there's no true
            // TODO: check if there's more than one true
            trueOptionsCounter = 0;
            data = {
                title : value.title,
                name : index
            };

            data.options = [];
            ($.each(value.value, function (innerIndex, innerValue) {
                if (innerValue) {
                    trueOptionsCounter++;
                }
                data.options.push({
                    title : innerIndex,
                    // if there's already option enabled set others to false
                    checked : (trueOptionsCounter > 1 ? false : innerValue)
                });
            }));
            // check if all options are disabled and enable first one
            if (trueOptionsCounter === 0) {
                data.options[1].checked = true;
            }
            body.append(radioTemplate(data));
        }
    });
});
