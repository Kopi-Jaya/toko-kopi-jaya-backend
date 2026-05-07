import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Member } from '../members/entities/member.entity';
import { Staff } from '../staff/entities/staff.entity';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingMember = await this.memberRepository.findOne({
      where: { email: dto.email },
    });

    if (existingMember) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const member = this.memberRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone_number: dto.phone_number ?? null,
      birthday: dto.birthday ?? null,
    });

    const savedMember = await this.memberRepository.save(member);

    const tokens = await this.generateTokens({
      sub: savedMember.member_id,
      type: 'member',
      email: savedMember.email ?? undefined,
    });

    return {
      member: {
        id: savedMember.member_id,
        name: savedMember.name,
        email: savedMember.email,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const isMember = dto.identifier.includes('@');

    if (isMember) {
      return this.loginAsMember(dto.identifier, dto.password);
    } else {
      return this.loginAsStaff(dto.identifier, dto.password);
    }
  }

  private async loginAsMember(email: string, password: string) {
    const member = await this.memberRepository.findOne({
      where: { email },
      select: [
        'member_id',
        'name',
        'email',
        'password',
        'tier',
        'current_points',
        'is_active',
      ],
    });

    if (!member || !member.is_active) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: member.member_id,
      type: 'member',
      email: member.email ?? undefined,
    });

    return {
      type: 'member',
      user: {
        id: member.member_id,
        name: member.name,
        email: member.email,
        tier: member.tier,
        current_points: member.current_points,
      },
      ...tokens,
    };
  }

  private async loginAsStaff(username: string, password: string) {
    const staff = await this.staffRepository.findOne({
      where: { username },
      select: [
        'staff_id',
        'username',
        'name',
        'password',
        'role',
        'outlet_id',
        'is_active',
      ],
    });

    if (!staff || !staff.is_active) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokens = await this.generateTokens({
      sub: staff.staff_id,
      type: 'staff',
      role: staff.role,
      outlet_id: staff.outlet_id,
    });

    return {
      type: 'staff',
      role: staff.role,
      user: {
        id: staff.staff_id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        outlet_id: staff.outlet_id,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refresh_token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const newPayload: JwtPayload = {
        sub: payload.sub,
        type: payload.type,
        role: payload.role,
        email: payload.email,
        outlet_id: payload.outlet_id,
      };

      return this.generateTokens(newPayload);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async generateTokens(payload: JwtPayload) {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const accessExpiry = this.configService.get<string>(
      'JWT_ACCESS_EXPIRY',
      '15m',
    );
    const refreshExpiry = this.configService.get<string>(
      'JWT_REFRESH_EXPIRY',
      '7d',
    );

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret,
        expiresIn: accessExpiry as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret,
        expiresIn: refreshExpiry as any,
      }),
    ]);

    return { access_token, refresh_token };
  }
}
