import {test} from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {Client} from "@modelcontextprotocol/client";
import {StdioClientTransport} from "@modelcontextprotocol/client/stdio";

test("stdio handshake, tool discovery, structured results, invalid inputs and overflow", {timeout:15000}, async () => {
  const client = new Client({name:"korean-wrap-test",version:"1.0.0"});
  const transport = new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL("../bin/server.js",import.meta.url))],stderr:"pipe"});
  let stderr = "";
  transport.stderr?.on("data", chunk => { stderr += chunk; });
  try {
    await client.connect(transport);
    const {tools} = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name),["wrap_korean_text"]);
    assert.equal(tools[0].annotations.readOnlyHint,true);
    const result = await client.callTool({name:"wrap_korean_text",arguments:{text:"AI 에이전트를 늘려도 개발이 빨라지지 않는 이유"}});
    assert.ok(!result.isError);
    assert.deepEqual(result.structuredContent.lines,["AI 에이전트를 늘려도","개발이 빨라지지 않는 이유"]);
    assert.deepEqual(JSON.parse(result.content[0].text),result.structuredContent);
    const overflow = await client.callTool({name:"wrap_korean_text",arguments:{text:"하나로연결된아주긴단어",maxWidth:4}});
    assert.equal(overflow.structuredContent.fits,false);
    for (const args of [{text:" "},{text:"a ".repeat(81)},{text:"가".repeat(1001)},{text:"제목",maxWidth:0},{text:"제목",maxLines:4}]) {
      const invalid = await client.callTool({name:"wrap_korean_text",arguments:args});
      assert.equal(invalid.isError,true);
    }
    assert.equal(stderr,"");
  } finally { await client.close(); }
});
