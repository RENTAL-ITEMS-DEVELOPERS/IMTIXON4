import { Repository } from "typeorm";
import { Client } from "../entity/client.entity";

export type ClientRepository = Repository<Client>;
