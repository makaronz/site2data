from langchain.document_loaders import JSONLoader
from langchain.output_parsers import JsonOutputParser
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Weaviate
import networkx as nx, json, zipfile, os

docs = JSONLoader("analysis.json").load()
g = nx.Graph()
for d in docs:
    g.add_node(d["scene_id"])
    for pair in d["relationships"]:
        if pair["strength"] >= .3:
            g.add_edge(pair["character_a"], pair["character_b"],
                       weight=pair["strength"])
nx.write_gexf(g, "network.gexf")

with zipfile.ZipFile("film.zip","w") as z:
    for f in ["analysis.json","locations.json","network.gexf"]:
        z.write(f) 