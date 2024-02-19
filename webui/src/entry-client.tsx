import init from "libkon";
import { mount, StartClient } from "@solidjs/start/client";

await init();
mount(() => <StartClient />, document.getElementById("app")!);
