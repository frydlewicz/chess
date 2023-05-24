import { Controller, Get, Render } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @Render('home')
    home() {
        return {
            title: 'Chess AI',
        };
    }

    @Get('game/ai')
    @Render('game')
    createGameWithAI() {
        return {
            title: 'Game | Chess AI',
        };
    }

    @Get('game/ai/:hash')
    @Render('game')
    joinGameWithAi() {
        return {
            title: 'Game | Chess AI',
        };
    }

    @Get('game/host')
    @Render('game')
    createGame() {
        return {
            title: 'Game | Chess AI',
        };
    }

    @Get('game/host/:hash')
    @Render('game')
    joinGameAsHost() {
        return {
            title: 'Game | Chess AI',
        };
    }

    @Get('game/host/:hash')
    @Render('game')
    joinGameAsGuest() {
        return {
            title: 'Game | Chess AI',
        };
    }
}
