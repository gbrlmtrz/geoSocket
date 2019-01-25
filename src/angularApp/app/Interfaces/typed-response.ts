import Response from '@Interfaces/response';
import Entity from '@Interfaces/entity';

export default interface TypedResponse<T extends Entity> extends Response {
    item?: T;
    items?: T[];
}
