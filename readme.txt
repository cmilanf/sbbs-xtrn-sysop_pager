Some kinda page-sysop thingie
by echicken, November 2017
echicken at bbs.electronicchicken.com
https://gitlab.synchro.net/main/sbbs/-/tree/master/xtrn/chat_pager
=====================================
Forked January 2024
karloch at bbs.hispamsx.org
https://github.com/cmilanf/sbbs-xtrn-sysop_pager
Adds following functionality
  1. Support for remote Raspberry Pi PC Speaker paging:
     https://github.com/cmilanf/rpi-netplaytone
  2. Support for paging via Telegram bot

1) Setup

- Install all the files from this repo in any directory accesible by sbbs.
  For example: /sbbs/xtrn/sysop_pager
- Run scfg
- Select 'Chat Features'
- Select 'External Sysop Chat Pagers'
- Hit enter on the blank line at the bottom to create a new record
- Set the 'Command Line' to: ?/sbbs/xtrn/sysop_pager/page_sysop.js

Notice Synchronet BBS will only use *one* external pager from the list.
Synchronet will take the list of external pagers as priority order, trying
each one. When paging is sucessful with one, it won't process the rest.
In order to make this pager to work, make sure to put the first in the
list of pagers or render the other ones inaccesible via Access Requirements.

2) Configuration

- Browse to the 'xtrn/sysop_pager/' directory
- Copy 'example-settings.ini' to a new file, name it 'settings.ini'
- Edit 'settings.ini'
- To use [telegram] notifications, set enable to true and fill
  chat_id and token fields.
- To use Raspberry Pi remote [pcspeaker] notifications, set enable to true
  and fill the api_url and the tone.
- In the [terminal] section, edit irc_server, irc_port, and irc_channel as needed

If when using Telegram you get this on you Synchronet BBS log:
term TLS WARNING 'Server provided a broken/invalid certificate, try again with a
reduced level of certificate compliance checking' (-32) setting attribute 6001

It looks like Synchronet is not trusting the TLS certificate chain from
api.telegram.org. If this is your case you may need to implement this workarround:
1/Add api.telegram.org to /etc/hosts, poiting to 127.0.0.1. 
2/Install a reverse proxy such as NGINX in localhost.
3/Listen only loopback interface (127.0.0.1).
4/Use the NGINX resolver directive to externally resolve api.telegram.org.
5/Use HTTP and not HTTPS in the api_url on this configuration.

Hopefully this won't be needed in the future.

3) IRC Bot setup

- Browse to the 'xtrn/sysop_pager/ircbot/' directory
- Open 'for-ircbot.ini' with a text editor
- Copy its contents to your clipboard
- Browse to your 'ctrl/' directory
- Open 'ircbot.ini' with a text editor
- Paste the previously copied file contents into the bottom of this file

4) Finishing Up

- Synchronet will need to recycle the terminal server thread to pick up changes
- It may be necessary to restart your BBS
- You will need to issue the 'restart' command to your IRC bot

5) Using

Users who page the sysop will be shown a progress/time bar while they wait for
you to respond.

Your IRC bot will notify you in the channel you've configured that somebody is
paging you.  Respond with the command '!chat n', where 'n' is the node number,
to pull the user into IRC chat.

6) Notes

I haven't tested this much.  Use at your own risk.

If you run your IRC bot via jsexec, the 'IRC Pull' feature will not work; I will
add a workaround for that soon.  It will work if you run your IRC bot as a
service.

Additional notification methods (other than IRC) may be added in the future.

You don't have to use the 'IRC Pull' feature; you can always go to your host
system and break into chat with the built in tools (from sbbsctrl or umonitor).
