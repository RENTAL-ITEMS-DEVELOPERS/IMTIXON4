import { Repository } from "typeorm";
import { Lessor } from "../entity/lessor.entity";

export type LessorRepository = Repository<Lessor>;
