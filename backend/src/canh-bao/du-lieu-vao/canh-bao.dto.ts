import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TaoCanhBaoDto {
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @IsEnum(['scream', 'help', 'threat', 'argument'])
  sound_type: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @IsOptional()
  @IsString()
  audio_file_url?: string;
}

export class CapNhatCanhBaoDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'false_alarm', 'resolved'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  is_evidence?: boolean;
}

export class TruyVanCanhBaoDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  sound_type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

