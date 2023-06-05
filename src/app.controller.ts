import { Controller, Get, Param, Render } from '@nestjs/common';

import { AppService } from './app.service';

const creationYear = 2023;
const currentYear = new Date().getFullYear();

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @Render('home')
    home() {
        return {
            title: 'Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
        };
    }

    @Get('game/ai')
    @Render('game')
    createGameWithAI() {
        return {
            title: 'Game | Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
            action: 'create',
            ai: true,
        };
    }

    @Get('game/ai/:roomId')
    @Render('game')
    joinGameWithAi(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
            action: 'join',
            ai: true,
            host: true,
            roomId,
        };
    }

    @Get('game/host')
    @Render('game')
    createGame() {
        return {
            title: 'Game | Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
            action: 'create',
        };
    }

    @Get('game/host/:roomId')
    @Render('game')
    joinGameAsHost(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
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
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
            action: 'join',
            roomId,
        };
    }

    @Get('game/watch/:roomId')
    @Render('game')
    watchGame(@Param('roomId') roomId: string) {
        return {
            title: 'Game | Chess AI',
            year: creationYear == currentYear ? currentYear : creationYear + '-' + currentYear,
            action: 'watch',
            roomId,
        };
    }
}
