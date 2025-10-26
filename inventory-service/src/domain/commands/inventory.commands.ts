import { MovementType } from '../shared/constants';

export class AdjustInventoryCommand {
  constructor(
    public readonly productId: string,
    public readonly type: MovementType,
    public readonly quantity: number,
    public readonly reason?: string,
    public readonly reference?: string,
  ) {}
}
