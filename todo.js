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
        data : '',                           // JSON data
        defaultTaskText : 'fill in...', // default text for new task
        mft : 2000,                     // message fadeout timeout
        containerId : '#container',
        groupClass : '.group',
        taskClass : '.task',
        groupNameClass : '.group_name',
        taskNameClass : '.name',
        taskStatusClass : '.status',
        taskFinishedClass : '.taskFinished',
        taskUnfinishedClass : '.taskUnfinished'

    };

    /**
     * Group template
     * @param id {string} Group id which looks like 'group-123456'
     * @param name {string} Group name
     * @param tasks {string} String concatenated from taskTemplate() calls
     *
     * @returns {string} html code of the group
     */
    vsjstodo.groupTemplate = function(id, name, tasks) {
        return "<div class='" + vsjstodo.groupClass.substring(1) + "' id='"+ (id||'') +"'>\
            <button class='add_new'>add</button>\
            <span class='" + vsjstodo.groupNameClass.substr(1) + "'>"+(name||'')+"</span><input class='group_name_input' type='text' style='display:none;'/>\
            <div class='groupDelete'>X</div><div class='groupShowHide'>_</div>\
            " + ( tasks|| '') + "\
        </div>";
    }
    /** 
     * Task template
     * @param status int 1/0
     * @param text string
     *
     * @returns {string} html code of the task
     */
    vsjstodo.taskTemplate = function(status, text) {
        status = Boolean(parseInt(status));
        return "<div class='" + vsjstodo.taskClass.substring(1) + "'>\
            <span class='" + vsjstodo.taskStatusClass.substr(1) + " " + ( status ? vsjstodo.taskFinishedClass.substr(1) : vsjstodo.taskUnfinishedClass.substr(1) ) + "'>" + (status? '+' : '-') + "</span>\
            <div class='taskDelete'>X</div>\
            <span class='" + vsjstodo.taskNameClass.substr(1) + "'>" + ( text || vsjstodo.defaultTaskText ) + "</span>\
            <input class='name_input' type='text' style='display:none;'/>\
        </div>";
    }
    /**
     * @function Wrapper to generate tasks in iterator function
     *
     * @param el {array} Single 'task' array from data object
     */
    vsjstodo.taskTemplateWrapper = function(el) {
        if(el)
            return vsjstodo.taskTemplate(el.status, el.text);
        else
            return '';
    }
    // vsjstodo functions
    vsjstodo.startEditing = function () {
        $(this).hide();
        $(this).next('input').attr('value',$(this).text()).show().focus();
    }
    vsjstodo.finishEditing = function (e) {
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
    vsjstodo.toggleTaskStatus = function () {
        if($(this).text() == "+" || $(this).hasClass(vsjstodo.taskFinishedClass.substring(1))) {
            $(this).text("-").removeClass(vsjstodo.taskFinishedClass.substr(1)).addClass(vsjstodo.taskUnfinishedClass.substr(1));
        }
        else {
            $(this).text("+").removeClass(vsjstodo.taskUnfinishedClass.substr(1)).addClass(vsjstodo.taskFinishedClass.substr(1))
        }
        vsjstodo.saveData();
    }
    vsjstodo.askAndDelete = function (elem) {
        elem.addClass('toDelete');
        if(confirm('remove' + (elem.find(vsjstodo.groupNameClass).text() ? ' "' + elem.find(vsjstodo.groupNameClass).text() + '"' : '') + '?')) {
            elem.remove();
            vsjstodo.saveData();
        }
        else
            elem.removeClass('toDelete');
    }
    vsjstodo.saveData = function () {
            $.ajax({
            url: 'save',
            type: 'POST',
            contenType : 'plain/text',
            data: { 'data': vsjstodo.dataToJSON()},
            success: function() {vsjstodo.showMessage("Transferred", "success")},
            error: function() {vsjstodo.showMessage("WTF? saving AJAX?")}
        })
    }
    
    vsjstodo.getData = function () {
        $.ajax({
            url: 'get',
            type: 'GET',
            dataType: 'text',
            beforeSend: function() {},
            success: function(data) {
                        vsjstodo.parseJSON(data);
                    },
            error: function() {vsjstodo.showMessage("WTF? getting AJAX?")}
        });
    }
    vsjstodo.parseJSON = function (data) {
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
    vsjstodo.addGroup = function (group) {
        var tasks = '';
        if(group.tasks) {
            vsjstodo.iterate(group.tasks, a = vsjstodo.createAppendToVarFunction(tasks,vsjstodo.taskTemplateWrapper));
        }
        $(vsjstodo.groupTemplate(group.id, group.name, a(false))).appendTo(vsjstodo.containerId);
    }
    vsjstodo.dataToJSON = function () {
        var data = '{"groups":[';
        $(vsjstodo.containerId).find(vsjstodo.groupClass).each(function(){
            data += '{"name":"' + $(this).find(vsjstodo.groupNameClass).text() + '","id":"' + $(this).attr('id') + '"';
            var tasks = $(this).find(vsjstodo.taskClass).length;
            if (tasks) {
                data += ',"tasks":[';
                $(this).find(vsjstodo.taskClass).each(function(){
                    data += '{"status" : "' + ( $(this).find(vsjstodo.taskStatusClass).hasClass(vsjstodo.taskUnfinishedClass.substr(1)) ? 0 : 1 ) + '", "text": "' +  $(this).find(vsjstodo.taskNameClass).text() + '"}';
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
    vsjstodo.generateGroupId = function () {
        // TODO: check if id already exists
        id = 'group-' + Math.ceil(Math.random() * 1000000);
        return id;
    }
    vsjstodo.showMessage = function (text, type, elId) {
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

    // Event handlers
    $("#add_group").click(function() {
        
        id = vsjstodo.generateGroupId();
        $(vsjstodo.groupTemplate(id)).appendTo(vsjstodo.containerId);
        $("#" + id + " span.group_name").text(id);
    });
    $("#save").click(function(){
       vsjstodo.saveData();
    });

    // group operations
    $(vsjstodo.groupNameClass).live('click',function() {
        vsjstodo.startEditing.call(this);
    });
    $(".group_name_input").live('keydown',function(e) {
        vsjstodo.finishEditing.call(this,e);
    });
    $(".groupShowHide").live('click',function() {
        if ($(this).text() == '_') {
            $(this).text('n').parent().find(vsjstodo.taskClass).hide();
    }
    else {
            $(this).text('_').parent().find(vsjstodo.taskClass).show();
    }
    });
    $(".groupDelete").live('click',function() {
        vsjstodo.askAndDelete($(this).parent(vsjstodo.groupClass));
    });

    // task operations
    $(".add_new").live('click',function(){
       $(vsjstodo.taskTemplate()).appendTo($(this).parents(vsjstodo.groupClass));
    });
    $(".taskDelete").live('click',function() {
        vsjstodo.askAndDelete($(this).parent(vsjstodo.taskClass));
    });
    $(".status").live('click',function(){
        vsjstodo.toggleTaskStatus.call(this);
    })
    $(".name").live('click',function(){
        vsjstodo.startEditing.call(this);
    });
    $(".name_input").live('keydown',function(e) {
        vsjstodo.finishEditing.call(this,e);
    });

    vsjstodo.iterate = function (obj, func) {
        for(var i=0; i < obj.length; i++) {
            func(obj[i]);
        }
    }
    vsjstodo.createAppendToVarFunction = function (variable, func) {
        return function (params) {
            variable += func(params);
            return variable;
        };
    }

    // loda data 
    vsjstodo.getData();
});
