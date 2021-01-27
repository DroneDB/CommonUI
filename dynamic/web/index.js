import menu from './menu';
import shell from './shell';
import pathutils from './pathutils';

if (!window.__menu){
    window.__menu = menu;
    window.__shell = shell;
    window.__pathutils = pathutils;
}