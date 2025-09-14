import { Repository } from "typeorm";
import { Images } from "../entity/image.entity";

export type ImagesRepository = Repository<Images>;
