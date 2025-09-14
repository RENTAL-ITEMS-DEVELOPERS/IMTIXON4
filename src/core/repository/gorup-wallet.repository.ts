import { Repository } from "typeorm";
import { Wallet } from "../entity/group-wallet.entity";

export type walletRepository = Repository<Wallet>;
