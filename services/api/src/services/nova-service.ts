import { novaDashboardSnapshot } from "../data/mock";

export class NovaService {
  getHealth() {
    return {
      status: "ok",
      chain: "Nova Mainnet",
      timestamp: new Date().toISOString()
    };
  }

  getDashboard() {
    return novaDashboardSnapshot;
  }

  getAdminQueue() {
    return novaDashboardSnapshot.adminQueue;
  }
}
