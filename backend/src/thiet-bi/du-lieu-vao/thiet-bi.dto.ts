import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TaoThietBiDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  area: string;

  @IsInt()
  @Min(1)
  @Max(10)
  floor: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  position_x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  position_y: number;
}

export class CapNhatThietBiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsNumber()
  position_x?: number;

  @IsOptional()
  @IsNumber()
  position_y?: number;

  @IsOptional()
  @IsEnum(['online', 'offline', 'error'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  battery_level?: number;
}

