import { ISuccess } from "./success.interface";

export const successRes = (data: any, statusCode: number = 200): ISuccess => {
  return {
    statusCode,
    message: "success",
    data,
  };
};
