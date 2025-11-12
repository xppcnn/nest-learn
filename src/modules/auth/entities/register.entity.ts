import { Exclude } from 'class-transformer';

export class RegisterEntity {
  id: number;
  username: string;
  email: string;

  @Exclude()
  password?: string | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RegisterEntity>) {
    Object.assign(this, partial);
  }
}
