import { Repository } from "typeorm";
import { Penalty } from "../entity/penalty.entity";

export type PenaltyRepository = Repository<Penalty>;
