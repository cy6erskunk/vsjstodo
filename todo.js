/**
 * @fileOverview This file includes code for VerySimpleJSTodo widget.
 * The widget creates a simle list of tasks in the container and allows to 
 * add/remove tasks, group them, mark as finished/unfinied. It also supports 
 * task groups and groups coollapsing.
 * The data is stored on the server-side in plain-text file in JSON format.
 * Server should support two methods: "get" and "save". Simple implementation
 * is in a.php file.
 */

$(function(){
    // basic VSJSTODO object
    function Vsjstodo() {
        /**
         * String representation of the widget data
         * @type {string}
         */
        data = '',
        /**
         * Default text for the new task
         * @type {string}
         */
        defaultTaskText = 'fill in...',
        /**
         * Messgae fadeout timeour
         * @type {int}
         */
        mft = 2000,
        /**
         * JQuery selector to find widget container
         * @type {string}
         */
        containerId = '#container',
        /**
         * JQuery selector for the task group element class
         * @type {string}
         */
        groupClass = '.group',
        /**
         * JQuery selector for the task element class
         * @type {string}
         */
        taskClass = '.task',
        /**
         * JQuery selector for the task group name element class
         * @type {string}
         */
        groupNameClass = '.group_name',
        /**
         * JQuery selector for the task name element class
         * @type {string}
         */
        taskNameClass = '.name',
        /**
         * JQuery selector for the task status element class
         * @type {string}
         */
        taskStatusClass = '.status',
        /**
         * JQuery selector for the finished task class
         * @type {string}
         */
        taskFinishedClass = '.taskFinished',
        /**
         * JQuery selector fot the unfinished task class
         * @type {string}
         */
        taskUnfinishedClass = '.taskUnfinished';

    };

    /**
     * Group template
     * @function
     *
     * @param id {string} Group id which looks like 'group-123456'
     * @param name {string} Group name
     * @param tasks {string} String concatenated from taskTemplate() calls
     *
     * @returns {!string} html code of the group
     */
    Vsjstodo.groupTemplate = function(id, name, tasks) {
        return "<div class='" + Vsjstodo.groupClass.substring(1) + "' id='" + (id||'') + "'>" + 
            "<button class='add_new'>add</button>" +
            "<span class='" + Vsjstodo.groupNameClass.substr(1) + "'>" + (name||'') +
            "</span><input class='group_name_input' type='text' style='display:none;'/>" +
            "<div class='groupDelete'>X</div><div class='groupShowHide'>_</div>" +
            ( tasks|| '') + 
            "</div>";
    }
    /** 
     * Task template
     * @function
     * @param status {?int} 1/0
     * @param text {?string}
     *
     * @returns {!string} html code of the task
     */
    Vsjstodo.taskTemplate = function(status, text) {
        status = Boolean(parseInt(status));
        return "<div class='" + Vsjstodo.taskClass.substring(1) + "'>" +
            "<span class='" + Vsjstodo.taskStatusClass.substr(1) + " " + ( status ? Vsjstodo.taskFinishedClass.substr(1) : Vsjstodo.taskUnfinishedClass.substr(1) ) + "'>" +
            (status? '+' : '-') + "</span>" +
            "<div class='taskDelete'>X</div>" +
            "<span class='" + Vsjstodo.taskNameClass.substr(1) + "'>" + ( text || Vsjstodo.defaultTaskText ) + "</span>" +
            "<input class='name_input' type='text' style='display:none;'/>" +
            "</div>";
    }
    /**
     * Wrapper to generate tasks in iterator function
     * @function
     * @param el {array} Single 'task' array from data object
     *
     * @returns {!string} html code for the task or empty string
     */
    Vsjstodo.taskTemplateWrapper = function(el) {
        if(el)
            return Vsjstodo.taskTemplate(el.status, el.text);
        else
            return '';
    }

    /**
     * Vsjstodo main functions block
     */
    /**
     * Replaces group or task name with input to start editinf
     * @function
     */
    Vsjstodo.startEditing = function() {
        $(this).hide().next('input').attr('value',$(this).text()).show().focus();
    }
    /**
     * Hides input and updates name locally and remotely on Enter or discards changes on Esc
     * @function
     * @param e {event} JQuery keydown event
     */
    Vsjstodo.finishEditing = function(e) {
        if (e.keyCode == '13') {
            $(this).hide();
            if($(this).val() == "")
                $(this).val(Vsjstodo.defaultTaskText);
            $(this).prev('span').text($(this).val()).show();
            Vsjstodo.saveData();
        }
        else if(e.keyCode == '27') {
            $(this).hide();
            $(this).prev('span').show();
        }
    }
    /**
     * Toggles task status ans saves data
     * @function
     */
    Vsjstodo.toggleTaskStatus = function() {
        if($(this).text() == "+" || $(this).hasClass(Vsjstodo.taskFinishedClass.substring(1))) {
            $(this).text("-").removeClass(Vsjstodo.taskFinishedClass.substr(1)).addClass(Vsjstodo.taskUnfinishedClass.substr(1));
        }
        else {
            $(this).text("+").removeClass(Vsjstodo.taskUnfinishedClass.substr(1)).addClass(Vsjstodo.taskFinishedClass.substr(1))
        }
        Vsjstodo.saveData();
    }
    /**
     * Ask confirmation and deletes task or group. Saves data after deletion.
     * @function
     * @param el {element} JQuery element to delete
     */
    Vsjstodo.askAndDelete = function(el) {
        elem.addClass('toDelete');
        if(confirm('remove' + (el.find(Vsjstodo.groupNameClass).text() ? ' "' + el.find(Vsjstodo.groupNameClass).text() + '"' : '') + '?')) {
            el.remove();
            Vsjstodo.saveData();
        }
        else
            el.removeClass('toDelete');
    }
    /**
     * Update data locally and sends it to the server
     * @function
     */
    Vsjstodo.saveData = function() {
        Vsjstodo.data = Vsjstodo.dataToJSON();
        $.ajax({
            url: 'save',
            type: 'POST',
            contenType : 'plain/text',
            data: { 'data': Vsjstodo.data},
            success: function() {Vsjstodo.showMessage("Transferred", "success")},
            error: function() {Vsjstodo.showMessage("WTF? saving AJAX?")}
        })
    }
   /**
    * Retrives data from server and calls Vsjstodo.parseJSON(data)
    * @function
    */
    Vsjstodo.getData = function() {
        $.ajax({
            url: 'get',
            type: 'GET',
            dataType: 'text',
            beforeSend: function () {},
            success: function (data) {Vsjstodo.parseJSON(data);},
            error: function () {Vsjstodo.showMessage("WTF? getting AJAX?")}
        });
    }
    /**
     * Parses JSON obtained from server, saves it locally and displays groups
     * @function
     * @param data {string} JSON data from the server
     */
    Vsjstodo.parseJSON = function(data) {
        /**
         * @default {}
         */
        var data = data || '{"groups":[]}';
        data = eval( '(' + data + ')' );
        if (data == 'suxx')
            Vsjstodo.showMessage('Oops - cannot open data file for reading');
        else if (data == 'suxx-suxx')
            Vsjstodo.showMessage("FfuuUUuuu!!111 - cannot read from data file");
        else {
            Vsjstodo.data = data;
            if (Vsjstodo.data && Vsjstodo.data.groups) {
                Vsjstodo.iterate(Vsjstodo.data.groups,Vsjstodo.addGroup);
            }
        }
    }
    /**
     * Displays group with its tasks
     * @function
     * @param group {object} group object from server JSON
     */
    Vsjstodo.addGroup = function(group) {
        var tasks = '';
        if(group.tasks) {
            Vsjstodo.iterate(group.tasks, a = Vsjstodo.createAppendToVarFunction(tasks,Vsjstodo.taskTemplateWrapper));
        }
        $(Vsjstodo.groupTemplate(group.id, group.name, a(false))).appendTo(Vsjstodo.containerId);
    }
    /**
     * Parses widget and generates JSON to send to the server
     * @function
     */
    Vsjstodo.dataToJSON = function() {
        var data = '{"groups":[';
        $(Vsjstodo.containerId).find(Vsjstodo.groupClass).each(function(){
            data += '{"name":"' + $(this).find(Vsjstodo.groupNameClass).text() + '","id":"' + $(this).attr('id') + '"';
            var tasks = $(this).find(Vsjstodo.taskClass).length;
            if (tasks) {
                data += ',"tasks":[';
                $(this).find(Vsjstodo.taskClass).each(function(){
                    data += '{"status" : "' + ( $(this).find(Vsjstodo.taskStatusClass).hasClass(Vsjstodo.taskUnfinishedClass.substr(1)) ? 0 : 1 ) + 
                        '", "text": "' +  $(this).find(Vsjstodo.taskNameClass).text() + '"}';
                    if($(this).next(Vsjstodo.taskClass).length) data +=',';
                });
                data += ']';
            }
            data += '}';  
            if($(this).next(Vsjstodo.groupClass).length) data +=',';
        });
        data += ']}';
        return data;
    }
    /**
     * Generates pseudo-random group id for the newly created group
     * @function
     *
     * @returns id {string} group id like 'group-123456'
     */
    Vsjstodo.generateGroupId = function() {
        // TODO: check if id already exists
        id = 'group-' + Math.ceil(Math.random() * 1000000);
        return id;
    }
    /**
     * Displays info message
     * @function
     * @param text {string} text to display
     * @patam type {string} classname to add to the message container, defaults to 'error'
     * @param elId {string} JQuery selector for the message container, defaults to '#message'
     */
    Vsjstodo.showMessage = function(text, type, elId) {
        /** 
         * @default 'error'
         */
        type = type || 'error';
        /**
         * @default '#message'
         */
        elId = elId || '#message';
        $(elId).attr('class',type).show().text(text).fadeOut(Vsjstodo.mft);
    }

    /**
     * Event handlers
     */
    /**
     * #add_group element click event, adds group to the widget
     * @event
     */
    $("#add_group").click(function() {
        
        id = Vsjstodo.generateGroupId();
        $(Vsjstodo.groupTemplate(id)).appendTo(Vsjstodo.containerId);
        $("#" + id + " span.group_name").text(id);
    });
    /**
     * #save element click event, saves data
     * @event
     */
    $("#save").click(function(){
       Vsjstodo.saveData();
    });
    /**
     * group operation events
     */
    /**
     * group name click event, starts group name editing
     * @event
     */
    // TODO: append keydown event to the global object to finish editing properly even if input element have lost focus
    $(Vsjstodo.groupNameClass).live('click',function() {
        Vsjstodo.startEditing.call(this);
    });
    /**
     * geoup_name_input keydown event - to finish editing group name
     * @event
     * @param e {event} JQuery event
     */
    // TODO: append keydown event to the global object to finish editing properly even if input element have lost focus
    $(".group_name_input").live('keydown',function(e) {
        Vsjstodo.finishEditing.call(this,e);
    });
    /**
     * Collspses/shows group
     * @event
     */
    $(".groupShowHide").live('click',function() {
        if ($(this).text() == '_') {
            $(this).text('n').parent().find(Vsjstodo.taskClass).hide();
        }
        else {
            $(this).text('_').parent().find(Vsjstodo.taskClass).show();
        }
    });
    /**
     * Starts group delete
     * @event
     */
    $(".groupDelete").live('click',function() {
        Vsjstodo.askAndDelete($(this).parent(Vsjstodo.groupClass));
    });

    /**
     * task operation events
     */
    /**
     * Starts new task creation
     * @event
     */
    $(".add_new").live('click',function(){
       $(Vsjstodo.taskTemplate()).appendTo($(this).parents(Vsjstodo.groupClass));
    });
    /**
     * starts task removal
     * @event
     */
    $(".taskDelete").live('click',function() {
        Vsjstodo.askAndDelete($(this).parent(Vsjstodo.taskClass));
    });
    /**
     * Toggles task status
     * @event
     */
    $(".status").live('click',function(){
        Vsjstodo.toggleTaskStatus.call(this);
    })
    /**
     * Starts task name editing
     * @event
     */
    $(".name").live('click',function(){
        Vsjstodo.startEditing.call(this);
    });
    /**
     * finished task name editing
     * @event
     */
    $(".name_input").live('keydown',function(e) {
        Vsjstodo.finishEditing.call(this,e);
    });
    /**
     * helper functions
     */
    /**
     * Iterates over object applying function to every element
     * @function
     * @param obj {object} Object to iterate
     * @param func {function} function to apply to object elements
     */
    Vsjstodo.iterate = function (obj, func) {
        for(var i=0; i < obj.length; i++) {
            func(obj[i]);
        }
    }
    /**
     * Creates function adding parameter function results to the variable specified
     * @function
     * @param variable {int|string} variable to append function results to
     * @param func {function} result of this function is appended to the variable
     *
     * @returns {function}
     */
    Vsjstodo.createAppendToVarFunction = function (variable, func) {
        return function (param) {
            variable += func(param);
            return variable;
        };
    }
    /**
     * load data 
     */
    Vsjstodo.getData();
});
