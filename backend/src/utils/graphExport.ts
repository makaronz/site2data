import fs from 'fs';

interface Character {
  id: string;
  name: string;
  role: string;
  centrality_score: number;
}

interface Relationship {
  character_a: string;
  character_b: string;
  strength: number;
  overall_sentiment: number;
  key_scenes?: string[];
}

export function exportNodesCSV(characters: Character[], outputPath: string) {
  const header = 'id,label,role,centrality_score\n';
  const rows = characters.map((c) =>
    `${c.id},${c.name},${c.role},${c.centrality_score}`
  );
  fs.writeFileSync(outputPath, header + rows.join('\n'), 'utf-8');
}

export function exportEdgesCSV(relationships: Relationship[], outputPath: string) {
  const header = 'source,target,weight,sentiment,scene_ids\n';
  const rows = relationships.map(r =>
    `${r.character_a},${r.character_b},${r.strength},${r.overall_sentiment},"${(r.key_scenes || []).join('|')}"`
  );
  fs.writeFileSync(outputPath, header + rows.join('\n'), 'utf-8');
}

export function exportGEXF(
  characters: Character[],
  relationships: Relationship[],
  outputPath: string
) {
  const nodes = characters
    .map(
      (c) =>
        `<node id="${c.id}" label="${c.name}">\n          <attvalues>\n            <attvalue for="role" value="${c.role}" />\n            <attvalue for="centrality_score" value="${c.centrality_score}" />\n          </attvalues>\n        </node>`
    )
    .join('\n');

  const edges = relationships
    .map(
      (r, idx) =>
        `<edge id="${idx}" source="${r.character_a}" target="${r.character_b}" weight="${r.strength}">\n          <attvalues>\n            <attvalue for="sentiment" value="${r.overall_sentiment}" />\n          </attvalues>\n        </edge>`
    )
    .join('\n');

  const gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3draft" version="1.3">
  <graph mode="static" defaultedgetype="undirected">
    <attributes class="node">
      <attribute id="role" title="Role" type="string"/>
      <attribute id="centrality_score" title="Centrality Score" type="float"/>
    </attributes>
    <attributes class="edge">
      <attribute id="sentiment" title="Sentiment" type="float"/>
    </attributes>
    <nodes>
      ${nodes}
    </nodes>
    <edges>
      ${edges}
    </edges>
  </graph>
</gexf>`;

  fs.writeFileSync(outputPath, gexf, 'utf-8');
} 