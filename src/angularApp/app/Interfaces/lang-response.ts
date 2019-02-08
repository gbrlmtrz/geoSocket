import Response from '@Interfaces/response';
import Lang from '@Interfaces/Entities/lang';

export default interface LangResponse extends Response{
    item?: Lang;
}
