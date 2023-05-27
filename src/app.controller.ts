import { Controller, Get, Param, Render } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

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
            action: 'create',
            ai: true,
        };
    }

    @Get('game/ai/:roomId')
    @Render('game')
    joinGameWithAi(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            action: 'join',
            ai: true,
            roomId,
        };
    }

    @Get('game/host')
    @Render('game')
    createGame() {
        return {
            title: 'Game | Chess AI',
            action: 'create',
        };
    }

    @Get('game/host/:roomId')
    @Render('game')
    joinGameAsHost(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            action: 'join',
            host: true,
            roomId,
        };
    }

    @Get('game/guest/:roomId')
    @Render('game')
    joinGameAsGuest(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            action: 'join',
            roomId,
        };
    }

    @Get('game/watch/:roomId')
    @Render('game')
    watchGame(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            action: 'watch',
            roomId,
        };
    }
}
