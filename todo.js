$(function(){
    // default text for new task
    empty_text = 'fill in...';
    // message fadeout timeout
    mft = 2000;
    // loda data 
    loadSavedData();

    //common buttons click
    $("#add_group").click(function() {
        id = generateGroupId();
       $("#group_template .group").clone().attr('id',id).appendTo("#container");
       $("#" + id + " span.group_name").text(id);
    });
    $("#save").click(function(){
       saveData();
       alert(dataToJSON($("#container")));
    });

    // group operations
    $(".group_name").live('click',function() {
        startEditing.call(this);
    });
    $(".group_name_input").live('keydown',function(e) {
        finishEditing.call(this,e);
    });
    $(".groupShowHide").live('click',function() {
        if ($(this).text() == '_') {
            $(this).text('n').parent().find(".task").hide();
    }
    else {
            $(this).text('_').parent().find(".task").show();
    }
    });
    $(".groupDelete").live('click',function() {
        askAndDelete($(this).parent('.group'));
    });

    // task operations
    $(".add_new").live('click',function(){
       $("#task_template .task").clone().appendTo($(this).parents(".group"));
    });
    $(".taskDelete").live('click',function() {
        askAndDelete($(this).parent('.task'));
    });
    $(".status").live('click',function(){
        toggleTaskStatus.call(this);
    })
    $(".name").live('click',function(){
        startEditing.call(this);
    });
    $(".name_input").live('keydown',function(e) {
        finishEditing.call(this,e);
    });

    // common functions
    function startEditing() {
        $(this).hide();
        $(this).next('input').attr('value',$(this).text()).show().focus();
    }
    
    function finishEditing(e) {
        if (e.keyCode == '13') {
            $(this).hide();
            if($(this).val() == "")
                $(this).val(empty_text);
            $(this).prev('span').text($(this).val()).show();
            saveData();
        }
    else if(e.keyCode == '27') {
        $(this).hide();
        $(this).prev('span').show();
    }
    }
    function toggleTaskStatus() {
        if($(this).text() == "+" || $(this).hasClass('taskDone')) {
            $(this).text("-").removeClass('taskDone').addClass('taskUndone');
        }
        else {
            $(this).text("+").removeClass('taskUndone').addClass('taskDone');
        }
        saveData();
    }
    function askAndDelete(elem) {
        elem.addClass('toDelete');
        if(confirm('remove' + (elem.find('.group_name').text() ? ' "' + elem.find('.group_name').text() + '"' : '') + '?')) {
        elem.remove();
        saveData();
    }
    else
        elem.removeClass('toDelete');
    }
    function saveData() {
        $.ajax({
            url: 'save',
            type: 'POST',
            data: {'data':escape($("#container").html())},
            success: function() {
                        $("#message").attr('class','success').show().text("Transferred").fadeOut(mft);
                    },
            error: function() {
                    $("#message").attr('class','error').show().text("WTF? AJAX?").fadeOut(mft);
                    }
        })
    }
    
    function loadSavedData() {
        $.ajax({
            url: 'get',
            type: 'GET',
            beforeSend: function() {
                    },
            success: function(data) {
                        if (data == 'suxx')
                            $("#message").attr('class','error').show().text("Oops").fadeOut(mft);
                        else if (data == 'suxx-suxx')
                            $("#message").attr('class','error').show().text("FfuuUUuuu!!111").fadeOut(mft);
                        else
                            $("#container").html(unescape(data));
                    },
            error: function() {
                    $("#message").attr('class','error').show().text("WTF? AJAX?").fadeOut(mft);
                    }
        });
    }

    function dataToJSON(container) {
    	var data = '{"groups":[';
	$(container).find(".group").each(function(){
		data += '{"name":"' + $(this).find('.group_name').text() + '","id":"' + $(this).attr('id') + '"}'; 	
		if($(this).next(".group").length) data +=',';
	});
	data += ']}';
	return data;
    }

    function generateGroupId() {
        id = 'group-' + Math.ceil(Math.random() * 1000000);
    return id;
    }
});
