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
    var vsjstodo = {
        /**
         * String representation of the widget data
         * @type {string}
         */
        data : '',
        /**
         * Default text for the new task
         * @type {string}
         */
        defaultTaskText : 'fill in...',
        /**
         * Messgae fadeout timeour
         * @type {int}
         */
        mft : 2000,
        /**
         * JQuery selector to find widget container
         * @type {string}
         */
        containerId : '#container',
        /**
         * JQuery selector for the task group element class
         * @type {string}
         */
        groupClass : '.group',
        /**
         * JQuery selector for the task element class
         * @type {string}
         */
        taskClass : '.task',
        /**
         * JQuery selector for the task group name element class
         * @type {string}
         */
        groupNameClass : '.group_name',
        /**
         * JQuery selector for the task name element class
         * @type {string}
         */
        taskNameClass : '.name',
        /**
         * JQuery selector for the task status element class
         * @type {string}
         */
        taskStatusClass : '.status',
        /**
         * JQuery selector for the finished task class
         * @type {string}
         */
        taskFinishedClass : '.taskFinished',
        /**
         * JQuery selector fot the unfinished task class
         * @type {string}
         */
        taskUnfinishedClass : '.taskUnfinished'

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
    vsjstodo.groupTemplate = function(id, name, tasks) {
        return "<div class='" + vsjstodo.groupClass.substring(1) + "' id='" + (id||'') + "'>" + 
            "<button class='add_new'>add</button>" +
            "<span class='" + vsjstodo.groupNameClass.substr(1) + "'>" + (name||'') +
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
    vsjstodo.taskTemplate = function(status, text) {
        status = Boolean(parseInt(status));
        return "<div class='" + vsjstodo.taskClass.substring(1) + "'>" +
            "<span class='" + vsjstodo.taskStatusClass.substr(1) + " " + ( status ? vsjstodo.taskFinishedClass.substr(1) : vsjstodo.taskUnfinishedClass.substr(1) ) + "'>" +
            (status? '+' : '-') + "</span>" +
            "<div class='taskDelete'>X</div>" +
            "<span class='" + vsjstodo.taskNameClass.substr(1) + "'>" + ( text || vsjstodo.defaultTaskText ) + "</span>" +
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
    vsjstodo.taskTemplateWrapper = function(el) {
        if(el)
            return vsjstodo.taskTemplate(el.status, el.text);
        else
            return '';
    }

    /**
     * vsjstodo main functions block
     */
    /**
     * Replaces group or task name with input to start editinf
     * @function
     */
    vsjstodo.startEditing = function() {
        $(this).hide().next('input').attr('value',$(this).text()).show().focus();
    }
    /**
     * Hides input and updates name locally and remotely on Enter or discards changes on Esc
     * @function
     * @param e {event} JQuery keydown event
     */
    vsjstodo.finishEditing = function(e) {
        if (e.keyCode == '13') {
            $(this).hide();
            if($(this).val() == "")
                $(this).val(vsjstodo.defaultTaskText);
            $(this).prev('span').text($(this).val()).show();
            vsjstodo.saveData();
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
    vsjstodo.toggleTaskStatus = function() {
        if($(this).text() == "+" || $(this).hasClass(vsjstodo.taskFinishedClass.substring(1))) {
            $(this).text("-").removeClass(vsjstodo.taskFinishedClass.substr(1)).addClass(vsjstodo.taskUnfinishedClass.substr(1));
        }
        else {
            $(this).text("+").removeClass(vsjstodo.taskUnfinishedClass.substr(1)).addClass(vsjstodo.taskFinishedClass.substr(1))
        }
        vsjstodo.saveData();
    }
    /**
     * Ask confirmation and deletes task or group. Saves data after deletion.
     * @function
     * @param el {element} JQuery element to delete
     */
    vsjstodo.askAndDelete = function(el) {
        el.addClass('toDelete');
        if(confirm('remove' + (el.find(vsjstodo.groupNameClass).text() ? ' "' + el.find(vsjstodo.groupNameClass).text() + '"' : '') + '?')) {
            el.remove();
            vsjstodo.saveData();
        }
        else
            el.removeClass('toDelete');
    }
    /**
     * Update data locally and sends it to the server
     * @function
     */
    vsjstodo.saveData = function() {
        vsjstodo.data = vsjstodo.dataToJSON();
        $.ajax({
            url: 'save',
            type: 'POST',
            contenType : 'plain/text',
            data: { 'data': vsjstodo.data},
            success: function() {vsjstodo.showMessage("Transferred", "success")},
            error: function() {vsjstodo.showMessage("WTF? saving AJAX?")}
        })
    }
   /**
    * Retrives data from server and calls vsjstodo.parseJSON(data)
    * @function
    */
    vsjstodo.getData = function() {
        $.ajax({
            url: 'get',
            type: 'GET',
            dataType: 'text',
            beforeSend: function () {},
            success: function (data) {vsjstodo.parseJSON(data);},
            error: function () {vsjstodo.showMessage("WTF? getting AJAX?")}
        });
    }
    /**
     * Parses JSON obtained from server, saves it locally and displays groups
     * @function
     * @param data {string} JSON data from the server
     */
    vsjstodo.parseJSON = function(data) {
        /**
         * @default {}
         */
        var data = data || '{"groups":[]}';
        data = eval( '(' + data + ')' );
        if (data == 'suxx')
            vsjstodo.showMessage('Oops - cannot open data file for reading');
        else if (data == 'suxx-suxx')
            vsjstodo.showMessage("FfuuUUuuu!!111 - cannot read from data file");
        else {
            vsjstodo.data = data;
            if (vsjstodo.data && vsjstodo.data.groups) {
                vsjstodo.iterate(vsjstodo.data.groups,vsjstodo.addGroup);
            }
        }
    }
    /**
     * Displays group with its tasks
     * @function
     * @param group {object} group object from server JSON
     */
    vsjstodo.addGroup = function(group) {
        var tasks = '';
        if(group.tasks) {
            vsjstodo.iterate(group.tasks, a = vsjstodo.createAppendToVarFunction(tasks,vsjstodo.taskTemplateWrapper));
        }
        $(vsjstodo.groupTemplate(group.id, group.name, a(false))).appendTo(vsjstodo.containerId);
    }
    /**
     * Parses widget and generates JSON to send to the server
     * @function
     */
    vsjstodo.dataToJSON = function() {
        var data = '{"groups":[';
        $(vsjstodo.containerId).find(vsjstodo.groupClass).each(function(){
            data += '{"name":"' + $(this).find(vsjstodo.groupNameClass).text() + '","id":"' + $(this).attr('id') + '"';
            var tasks = $(this).find(vsjstodo.taskClass).length;
            if (tasks) {
                data += ',"tasks":[';
                $(this).find(vsjstodo.taskClass).each(function(){
                    data += '{"status" : "' + ( $(this).find(vsjstodo.taskStatusClass).hasClass(vsjstodo.taskUnfinishedClass.substr(1)) ? 0 : 1 ) + 
                        '", "text": "' +  $(this).find(vsjstodo.taskNameClass).text() + '"}';
                    if($(this).next(vsjstodo.taskClass).length) data +=',';
                });
                data += ']';
            }
            data += '}';  
            if($(this).next(vsjstodo.groupClass).length) data +=',';
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
    vsjstodo.generateGroupId = function() {
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
    vsjstodo.showMessage = function(text, type, elId) {
        /** 
         * @default 'error'
         */
        type = type || 'error';
        /**
         * @default '#message'
         */
        elId = elId || '#message';
        $(elId).attr('class',type).show().text(text).fadeOut(vsjstodo.mft);
    }

    /**
     * Event handlers
     */
    /**
     * #add_group element click event, adds group to the widget
     * @event
     */
    $("#add_group").click(function() {
        
        id = vsjstodo.generateGroupId();
        $(vsjstodo.groupTemplate(id)).appendTo(vsjstodo.containerId);
        $("#" + id + " span.group_name").text(id);
    });
    /**
     * #save element click event, saves data
     * @event
     */
    $("#save").click(function(){
       vsjstodo.saveData();
    });
    /**
     * group operation events
     */
    /**
     * group name click event, starts group name editing
     * @event
     */
    // TODO: append keydown event to the global object to finish editing properly even if input element have lost focus
    $(vsjstodo.groupNameClass).live('click',function() {
        vsjstodo.startEditing.call(this);
    });
    /**
     * geoup_name_input keydown event - to finish editing group name
     * @event
     * @param e {event} JQuery event
     */
    // TODO: append keydown event to the global object to finish editing properly even if input element have lost focus
    $(".group_name_input").live('keydown',function(e) {
        vsjstodo.finishEditing.call(this,e);
    });
    /**
     * Collspses/shows group
     * @event
     */
    $(".groupShowHide").live('click',function() {
        if ($(this).text() == '_') {
            $(this).text('n').parent().find(vsjstodo.taskClass).hide();
        }
        else {
            $(this).text('_').parent().find(vsjstodo.taskClass).show();
        }
    });
    /**
     * Starts group delete
     * @event
     */
    $(".groupDelete").live('click',function() {
        vsjstodo.askAndDelete($(this).parent(vsjstodo.groupClass));
    });

    /**
     * task operation events
     */
    /**
     * Starts new task creation
     * @event
     */
    $(".add_new").live('click',function(){
       $(vsjstodo.taskTemplate()).appendTo($(this).parents(vsjstodo.groupClass));
    });
    /**
     * starts task removal
     * @event
     */
    $(".taskDelete").live('click',function() {
        vsjstodo.askAndDelete($(this).parent(vsjstodo.taskClass));
    });
    /**
     * Toggles task status
     * @event
     */
    $(".status").live('click',function(){
        vsjstodo.toggleTaskStatus.call(this);
    })
    /**
     * Starts task name editing
     * @event
     */
    $(".name").live('click',function(){
        vsjstodo.startEditing.call(this);
    });
    /**
     * finished task name editing
     * @event
     */
    $(".name_input").live('keydown',function(e) {
        vsjstodo.finishEditing.call(this,e);
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
    vsjstodo.iterate = function (obj, func) {
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
    vsjstodo.createAppendToVarFunction = function (variable, func) {
        return function (param) {
            variable += func(param);
            return variable;
        };
    }
    /**
     * load data 
     */
    vsjstodo.getData();
});
