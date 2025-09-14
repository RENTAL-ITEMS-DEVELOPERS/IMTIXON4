import { Repository } from "typeorm";
import { Item } from "../entity/item.entity";

export type ItemRepository = Repository<Item>;
