export default interface Entity {
  readonly _id : string;
  [propName: string]: any;
};
