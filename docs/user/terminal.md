# Terminal

Each thread’s terminal drawer opens shells on the environment that owns the
thread. When you are connected to a local environment as well, the drawer’s
**New terminal** control can also open a tab on this machine so you can run
local commands without leaving the remote thread. Those tabs show the local
host name next to the tab label. History for each tab stays on the machine that
runs its shell.

## Terminal history

Each terminal keeps up to 5,000 lines and 8 MiB of scrollback on its environment
server. T3 Code removes the oldest output when either limit is reached. A long
line can be shortened at the start. New terminal output is not truncated.

These limits apply when you reconnect and when T3 Code restores saved terminal
history. A client can show less scrollback than the server keeps.
