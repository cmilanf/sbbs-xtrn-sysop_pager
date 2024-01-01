/* Uses Synchronet BBS JS Object Model
https://synchro.net/docs/jsobjs.html */
load('sbbsdefs.js');
load('frame.js');
load('progress-bar.js');
require('http.js', 'HTTPRequest');
load(js.exec_dir + 'lib.js');

const REVISION = "1.0";
log(LOG_INFO, "SYSOP_PAGER v" + REVISION + " invoked by user (#" + user.number + ") " + user.alias);

function notify_via_telegram(api_url, chat_id, token) {
    var http_request = new HTTPRequest();
    var text = "### " + system.name + " - PAGING EVENT ###\n";
    text += "User: (#" + user.number + ") [" + user.alias + "] " + user.name + "\n";
    text += "IP: " + user.ip_address + "\n";
    text += "Hostname: " + user.host_name + "\n";
    text += "Email: " + user.email + "\n";
    text += "Protocol: " + user.connection + "\n";
    text += "Logon time: "
        + new Date(user.logontime*1000).toLocaleString(system.timezone)
        + "\n";

    log(LOG_INFO, "SYSOP_PAGER: Telegram => " + api_url);
    api_url_token = api_url.replace("{TOKEN}", token);
    req_url = encodeURI(api_url_token + "?chat_id=" + chat_id + "&text=" + text);
    try {
        http_request.Get(req_url);
    } catch (e) {
        log(LOG_ERR, "SYSOP_PAGER: (Telegram) " + e);
        alert(e);
    }
    if(http_request.response_code != http_request.status.ok) {
        log(LOG_ERR, "SYSOP_PAGER: (Telegram) Error => Response code " + http_request.response_code);
    }
}

function notify_via_remote_pcspeaker(api_url, tone) {
    var http_request = new HTTPRequest();
    if (!api_url.endsWith('/'))
        api_url += '/';
    log(LOG_INFO, "SYSOP_PAGER: Remote PCSpeaker => " + api_url + tone);
    try {
        http_request.Get(api_url + tone);
    } catch (e) {
        log(LOG_ERR, "SYSOP_PAGER: (PC Speaker) " + e);
        alert(e);
    }
    if(http_request.response_code != http_request.status.ok) {
        log(LOG_ERR, "SYSOP_PAGER: (PC Speaker) Response code " + http_request.response_code);
    }
}

function get_node_response_time(filename) {
    return (file_exists(filename) ? file_date(filename) : null);
}

function await_page_response(settings, frame) {

    if (!settings.queue.disabled) {
        var queue = new Queue(settings.queue.queue_name);
        var valname = "chat_" + bbs.node_num;
    } else {
        var valname = system.ctrl_dir + 'syspage_response.' + bbs.node_num;
    }

    if (settings.email.enabled) notify_via_email(settings.email, user.number);
    if (settings.telegram.enabled) notify_via_telegram(
        settings.telegram.api_url,
        settings.telegram.chat_id,
        settings.telegram.token
    );
    if (settings.pcspeaker.enabled) notify_via_remote_pcspeaker(
        settings.pcspeaker.api_url,
        settings.pcspeaker.tone
    );

    var answered = false;
    var stime = system.timer;
    var utime = system.timer;
    var progress_bar = new ProgressBar(1, 2, frame.width, frame);
    progress_bar.init();

    while (
        (system.timer - stime) * 1000 < settings.terminal.wait_time &&
        console.inkey(K_NONE, 5) == '' &&
        !answered
    ) {
        var now = system.timer;
        if (now - utime >= 1) {
            progress_bar.set_progress(
                (((now - stime) * 1000) / settings.terminal.wait_time) * 100
            );
            utime = now;
        }
        var val = (
            !settings.queue.disabled
            ? get_last_queued_value(queue, valname)
            : get_node_response_time(valname)
        );
        if (typeof val == 'number' && val > stime) answered = true;
        if (frame.cycle()) {
            console.gotoxy(console.screen_columns, console.screen_rows);
        }
        bbs.nodesync();
        yield();
    }

    progress_bar.set_progress(100);
    if (frame.cycle()) {
        console.gotoxy(console.screen_columns, console.screen_rows);
    }

    if (settings.queue.disabled && file_exists(valname)) file_remove(valname);

    return answered;

}

function main() {
    console.clear();
    printf("\r\nExternal Sysop Pager for Synchronet v%s\r\n", REVISION);
    printf("Paging sysop, please wait...\r\n");
    var sys_stat = bbs.sys_status;
    bbs.sys_status|=SS_MOFF;
    var settings = load_settings(js.exec_dir + 'settings.ini');
    var frame = new Frame(1, 1, console.screen_columns, 4, WHITE);
    frame.center(format(settings.terminal.wait_message, system.operator));
    frame.gotoxy(1, 3);
    frame.center(settings.terminal.cancel_message);
    frame.open();
    if (settings !== null && await_page_response(settings, frame)) {
        if (settings.terminal.irc_pull) {
            bbs.exec(
                format(
                    '?irc.js -a %s %s %s',
                    settings.terminal.irc_server,
                    settings.terminal.irc_port,
                    settings.terminal.irc_channel
                )
            );
        }
    } else {
        frame.gotoxy(1, 3);
        frame.center(format(bbs.text(522).trim(), system.operator));
        frame.cycle();
        frame.close();
        console.gotoxy(1, frame.y + frame.height);
        console.pause();
    }
    bbs.sys_status = sys_stat;
}

// ES5 doesn't feature String.endsWith, so the prototype is extended here.
// Thanks to SheetJS from StackOverflow for the code
// https://stackoverflow.com/questions/18768344/javascript-endswith-function-not-working
String.prototype.endsWith = function(searchString, position){
    position = position || this.length;
    position = position - searchString.length;
    var lastIndex = this.lastIndexOf(searchString);
    return lastIndex !== -1 && lastIndex === position;
};

main();
