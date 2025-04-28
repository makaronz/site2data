import { sceneChain } from "./sceneChain";

test("scene prompt returns required keys", async () => {
  const output = await sceneChain.invoke({ script:"INT. OFFICE - DAY...\n" });
  expect(output).toHaveProperty("location");
}); 