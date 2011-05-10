$(function(){
    // basic VSJSTODO object
    var vsjstodo = {
        // default text for new task
        defaultTaskText : 'fill in...',
        // message fadeout timeout
        mft : 2000,
        containerId : '#container',
        groupClass : '.group',
        taskClass : '.task',
        groupNameClass : '.group_name',
        taskNameClass : '.name',
        taskStatusClass : '.status',
        taskFinishedClass : '.taskFinished',
        taskUnfinishedClass : '.taskUnfinished'

    }

    // Group template
    vsjstodo.groupTemplate = $("<div class='" + vsjstodo.groupClass.substring(1) + "'>\
            <button class='add_new'>add</button>\
            <span class='" + vsjstodo.groupNameClass.substr(1) + "'></span><input class='group_name_input' type='text' style='display:none;'/>\
            <div class='groupDelete'>X</div><div class='groupShowHide'>_</div>\
        </div>");
    // Task template
    vsjstodo.taskTemplate = $("<div class='" + vsjstodo.taskClass.substring(1) + "'>\
            <span class='" + vsjstodo.taskStatusClass.substr(1) + " " + vsjstodo.taskUnfinishedClass.substr(1) + "'>-</span>\
            <div class='taskDelete'>X</div>\
            <span class='" + vsjstodo.taskNameClass.substr(1) + "'>" + vsjstodo.defaultTaskText + "</span>\
            <input class='name_input' type='text' style='display:none;'/>\
        </div>");

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
            data: {'data':escape($(vsjstodo.containerId).html())},
            success: function() {
                        $("#message").attr('class','success').show().text("Transferred").fadeOut(vsjstodo.mft);
                    },
            error: function() {
                        $("#message").attr('class','error').show().text("WTF? AJAX?").fadeOut(vsjstodo.mft);
                    }
        })
    }
    
    vsjstodo.loadSavedData = function () {
        $.ajax({
            url: 'get',
            type: 'GET',
            beforeSend: function() {
                    },
            success: function(data) {
                        if (data == 'suxx')
                            $("#message").attr('class','error').show().text("Oops").fadeOut(vsjstodo.mft);
                        else if (data == 'suxx-suxx')
                            $("#message").attr('class','error').show().text("FfuuUUuuu!!111").fadeOut(vsjstodo.mft);
                        else
                            $(vsjstodo.containerId).html(unescape(data));
                    },
            error: function() {
                        $("#message").attr('class','error').show().text("WTF? AJAX?").fadeOut(vsjstodo.mft);
                    }
        });
    }
    vsjstodo.dataToJSON = function (container) {
        var data = '{"groups":[';
        $(container).find(vsjstodo.groupClass).each(function(){
            data += '{"name":"' + $(this).find(vsjstodo.groupNameClass).text() + '","id":"' + $(this).attr('id') + '"';
            var tasks = $(this).find(vsjstodo.taskClass).length;
            if (tasks) {
                data += ',"tasks":[';
                $(this).find(vsjstodo.taskClass).each(function(){
                    data += '{"status" : "' + ( $(this).find(vsjstodo.taskStatusClass).hasClass(vsjstodo.taskFinishedClass.substr(1)) ? 1 : 0 ) + '", "text": "' +  $(this).find(vsjstodo.taskNameClass).text() + '"}';
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
        id = 'group-' + Math.ceil(Math.random() * 1000000);
        return id;
    }

    // loda data 
    vsjstodo.loadSavedData();

    // Event handlers
    $("#add_group").click(function() {
        id = vsjstodo.generateGroupId();
       vsjstodo.groupTemplate.clone().attr('id',id).appendTo(vsjstodo.containerId);
       $("#" + id + " span.group_name").text(id);
    });
    $("#save").click(function(){
       vsjstodo.saveData();
       alert(vsjstodo.dataToJSON($(vsjstodo.containerId)));
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
       vsjstodo.taskTemplate.clone().appendTo($(this).parents(vsjstodo.groupClass));
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

});
