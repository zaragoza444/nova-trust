import { PageShell } from "../../components/page-shell";
import { blocks } from "../../lib/mock-data";

export default function BlocksPage() {
  return (
    <PageShell
      title="Blocks explorer"
      description="Inspect recent finality, validator production, and throughput on the Nova permissioned network."
    >
      <article className="card">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>Validator</th>
                <th>Transactions</th>
                <th>Gas used</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.number}>
                  <td>{block.number}</td>
                  <td>{block.validator}</td>
                  <td>{block.txs}</td>
                  <td>{block.gasUsed}</td>
                  <td>{block.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </PageShell>
  );
}
