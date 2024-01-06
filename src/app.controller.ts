import { Controller, Get, Param, Render } from '@nestjs/common';

import { IControllerPayload } from './app.types';
import { AppService } from './app.service';

const creationYear = 2023;
const currentYear = new Date().getFullYear();
const year = creationYear == currentYear ? currentYear.toString() : creationYear + '-' + currentYear;

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @Render('home')
    home(): IControllerPayload {
        return {
            title: 'Chess AI',
            year,
        };
    }

    @Get('game/ai')
    @Render('game')
    createGameWithAI(): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'create',
            ai: true,
        };
    }

    @Get('game/ai/:roomId')
    @Render('game')
    joinGameWithAi(@Param('roomId') roomId: string): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'join',
            ai: true,
            host: true,
            roomId,
        };
    }

    @Get('game/host')
    @Render('game')
    createGame(): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'create',
        };
    }

    @Get('game/host/:roomId')
    @Render('game')
    joinGameAsHost(@Param('roomId') roomId: string): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'join',
            host: true,
            roomId,
        };
    }

    @Get('game/guest/:roomId')
    @Render('game')
    joinGameAsGuest(@Param('roomId') roomId: string): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'join',
            roomId,
        };
    }

    @Get('game/watch/:roomId')
    @Render('game')
    watchGame(@Param('roomId') roomId: string): IControllerPayload {
        return {
            title: 'Game | Chess AI',
            year,
            action: 'watch',
            roomId,
        };
    }
}
