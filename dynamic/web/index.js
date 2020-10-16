import menu from './menu';
import shell from './shell';

if (!window.__menu){
    window.__menu = menu;
    window.__shell = shell;
}