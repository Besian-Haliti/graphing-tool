import GraphTool from "./component/GraphTool/GraphTool";
import PromptTool from "./component/TrainingTool/PromptTool";
import './hometool.css';

export default function Home() {
  return (
    <div className="home-container">
      <GraphTool/>
      <PromptTool/>
    </div>
  );
}
