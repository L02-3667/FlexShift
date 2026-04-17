import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ensureAllowedRole } from '../common/policies/role-policy';
import { AnnouncementsService } from './announcements.service';
import {
  AnnouncementAcknowledgementResponseDto,
  AnnouncementDeleteResponseDto,
  AnnouncementResponseDto,
} from './dto/announcement-response.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

const announcementExample = {
  id: 'cm9m4n2n70000l5081l0a1abc',
  title: 'Shift handover update',
  body: 'Starting tomorrow, every closing shift must submit a handover note before clock-out.',
  scopeRole: 'employee',
  requiresAck: true,
  acknowledgedAt: null,
  publishedAt: '2026-04-17T09:00:00.000Z',
  expiresAt: null,
  updatedAt: '2026-04-17T09:00:00.000Z',
};

const unauthorizedErrorExample = {
  statusCode: 401,
  message: 'Unauthorized',
  requestId: 'req_123',
  timestamp: '2026-04-17T09:00:00.000Z',
};

const forbiddenErrorExample = {
  statusCode: 403,
  message: 'Forbidden resource',
  requestId: 'req_123',
  timestamp: '2026-04-17T09:00:00.000Z',
};

const notFoundErrorExample = {
  statusCode: 404,
  message: 'Announcement was not found.',
  requestId: 'req_123',
  timestamp: '2026-04-17T09:00:00.000Z',
};

const validationErrorExample = {
  statusCode: 400,
  message: [
    'title must be longer than or equal to 4 characters',
    'body must be longer than or equal to 8 characters',
  ],
  error: 'Bad Request',
  requestId: 'req_123',
  timestamp: '2026-04-17T09:00:00.000Z',
};

@ApiTags('announcements')
@ApiBearerAuth('access-token')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({
    summary: 'List announcements visible to the current user',
    description:
      'Requires bearer authentication. Returns announcements visible to the current user in descending published order. No pagination or filter query params are currently supported.',
  })
  @ApiOkResponse({
    type: AnnouncementResponseDto,
    isArray: true,
    description: 'Visible announcements for the authenticated user.',
    schema: {
      example: [announcementExample],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.announcementsService.list(currentUser);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single announcement',
    description:
      'Requires bearer authentication. Managers and admins can read any announcement. Employees can only read announcements that are currently visible to their role.',
  })
  @ApiParam({ name: 'id', example: 'cm9m4n2n70000l5081l0a1abc' })
  @ApiOkResponse({
    type: AnnouncementResponseDto,
    description: 'Announcement detail.',
    schema: {
      example: announcementExample,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  @ApiNotFoundResponse({
    description: 'Announcement was not found or is not visible to this user.',
    schema: {
      example: notFoundErrorExample,
    },
  })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.findOne(currentUser, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an announcement',
    description:
      'Requires bearer authentication and a manager/admin role. Validation rules: title 4-120 chars, body 8-1200 chars, scopeRole optional, requiresAck required.',
  })
  @ApiBody({
    type: CreateAnnouncementDto,
    description: 'Announcement payload.',
  })
  @ApiCreatedResponse({
    type: AnnouncementResponseDto,
    description: 'Announcement created.',
    schema: {
      example: announcementExample,
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    schema: {
      example: validationErrorExample,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  @ApiForbiddenResponse({
    description: 'Only managers or admins can create announcements.',
    schema: {
      example: forbiddenErrorExample,
    },
  })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateAnnouncementDto,
  ) {
    ensureAllowedRole(currentUser, 'manager', 'admin');
    return this.announcementsService.create(currentUser, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an announcement',
    description:
      'Requires bearer authentication and a manager/admin role. Accepts any subset of the create payload fields.',
  })
  @ApiParam({ name: 'id', example: 'cm9m4n2n70000l5081l0a1abc' })
  @ApiBody({
    type: UpdateAnnouncementDto,
    description: 'Partial announcement payload.',
  })
  @ApiOkResponse({
    type: AnnouncementResponseDto,
    description: 'Announcement updated.',
    schema: {
      example: {
        ...announcementExample,
        title: 'Updated shift handover update',
        updatedAt: '2026-04-17T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    schema: {
      example: validationErrorExample,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  @ApiNotFoundResponse({
    description: 'Announcement does not exist.',
    schema: {
      example: notFoundErrorExample,
    },
  })
  @ApiForbiddenResponse({
    description: 'Only managers or admins can update announcements.',
    schema: {
      example: forbiddenErrorExample,
    },
  })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateAnnouncementDto,
  ) {
    ensureAllowedRole(currentUser, 'manager', 'admin');
    return this.announcementsService.update(currentUser, id, input);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an announcement',
    description:
      'Requires bearer authentication and a manager/admin role. This permanently removes the announcement and its acknowledgement rows.',
  })
  @ApiParam({ name: 'id', example: 'cm9m4n2n70000l5081l0a1abc' })
  @ApiOkResponse({
    type: AnnouncementDeleteResponseDto,
    description: 'Announcement deleted.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  @ApiNotFoundResponse({
    description: 'Announcement does not exist.',
    schema: {
      example: notFoundErrorExample,
    },
  })
  @ApiForbiddenResponse({
    description: 'Only managers or admins can delete announcements.',
    schema: {
      example: forbiddenErrorExample,
    },
  })
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    ensureAllowedRole(currentUser, 'manager', 'admin');
    return this.announcementsService.remove(currentUser, id);
  }

  @Post(':id/ack')
  @ApiOperation({
    summary: 'Acknowledge an announcement',
    description:
      'Requires bearer authentication. Upserts the acknowledgement timestamp for the current user.',
  })
  @ApiParam({ name: 'id', example: 'cm9m4n2n70000l5081l0a1abc' })
  @ApiCreatedResponse({
    type: AnnouncementAcknowledgementResponseDto,
    description: 'Announcement acknowledgement recorded.',
    schema: {
      example: {
        success: true,
        acknowledgedAt: '2026-04-17T09:20:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT access token.',
    schema: {
      example: unauthorizedErrorExample,
    },
  })
  @ApiNotFoundResponse({
    description: 'Announcement was not found or is not visible to this user.',
    schema: {
      example: notFoundErrorExample,
    },
  })
  acknowledge(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.acknowledge(currentUser, id);
  }
}
