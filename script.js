$(function() {
    /**
     * defaults.js should be executed before this file invocations as soon as
     * namespace object XXX is created there and populated with 'defaults' and
     * 'options' (that is defaults extended with localStorage values) 
     * properties
     */

    XXX.initialTaskText = "click me to start editing...",
    /**
     * @function
     * Clones task row from template table
     */
    XXX.createTask = function() {
        $(".template tr").clone().insertAfter(".tasksHeader");
    };
    XXX.removeTask = function() {
        $(this).parents("tr:first").remove();
    }
    /** 
     * @function
     * Replaces task static element with span
     */
    XXX.startTaskEditing = function() {
        XXX.debug.enabled && XXX.debug.appendLog($(this).text());
        var parent = $(this).parent();
        parent.html("<input type='text' class='editTask' value='" + 
            ( $(this).text() === XXX.initialTaskText ? "" : $(this).text() ) + 
            "'/>");
        parent.find('.editTask').focus();
    };
    /**
     * @function
     * Replaces task editing input with span
     */
    XXX.finishTaskEditing = function(e) {
        if (e.keyCode == '13') {
            $(this).parent().html('<span>' + ( $(this).val() || XXX.initialTaskText ) + '</span>');
        }
        XXX.saveToLocalStorage();
    };
    XXX.saveToLocalStorage = function() {
        localStorage.data = $('.tasks').html();
        console.log(localStorage.data);
    };
    XXX.restoreFromLocalStorage = function() {
        localStorage.data && $('.tasks').html(localStorage.data);
    };
    XXX.toggleUrgency = function() {
        var elem = $(this).parents('tr:first').find('.task');
        elem.hasClass('urgent') ? elem.removeClass('urgent') : elem.addClass('urgent');
    };
    XXX.toggleStatus = function() {
        var elem = $(this).parents('tr:first').find('.task');
        elem.hasClass('taskDone') ? elem.removeClass('taskDone') : elem.addClass('taskDone');
    };
    /**
     * @namespace 
     * Dummy Debug element, to be removed
     */
    XXX.debug = {
      'enabled' : false,
      'elem' : $('.debug'),
      'appendLog' : function(text) {$
            XXX.debug.elem.html(XXX.debug.elem.html() + "<br/>" + text);
          }
    };

    // Event Handlers
    $('.addTask').click( function () { XXX.createTask.apply(this); });
    $('.saveData').click( function () { XXX.saveToLocalStorage(); });
    $('.reloadData').click( function () { XXX.restoreFromLocalStorage(); });

    $('.removeTask').live('click', function() { XXX.removeTask.apply(this); });
    $('.editTask').live('keypress', function(e) { XXX.finishTaskEditing.call(this, e); });
    $('.tasks .task span').live('click', function() { XXX.startTaskEditing.apply(this); });
    $('.toggleUrgency').live('click', function() { XXX.toggleUrgency.apply(this); });
    $('.toggleStatus').live('click', function() { XXX.toggleStatus.apply(this); });

    // show debug element if debug was enabled
    XXX.debug.enabled && $(XXX.debug.elem).show();

    // Put default task name into the template
    $('.template .task span').text(XXX.initialTaskText);
    // Restore data from local storage
    XXX.restoreFromLocalStorage();
    // TODO: options page: autosave after all actions, autosave after create/edit/delete
});
