import { Button, Panel, Stack } from "rsuite";
import TwoLineItem from "./TwoLineItem";

export default function VehicleDetails({ onCreateWorkOrder }) {
  return (
    <Panel bordered style={{ background: "#064D5F08" }}>
      <Stack spacing={16}>
        <Stack.Item grow={1}>
          <div className="text-center">
            <TwoLineItem
              title="Vehicle No."
              subtitle="BIV2023"
              subtitleStyle={{ fontSize: "30px" }}
            />
          </div>
        </Stack.Item>
        <Stack.Item grow={2}>
          <Stack spacing={8} className="mb-3">
            <Stack.Item grow={1}>
              <TwoLineItem title="Model" subtitle="M1" />
            </Stack.Item>
            <Stack.Item grow={1}>
              <TwoLineItem title="Make" subtitle="BMW" />
            </Stack.Item>
            <Stack.Item grow={1}>
              <TwoLineItem title="Engine No." subtitle="21312312312312" />
            </Stack.Item>
          </Stack>
          <Stack spacing={8}>
            <Stack.Item grow={1}>
              <TwoLineItem title="Model" subtitle="M1" />
            </Stack.Item>
            <Stack.Item grow={1}>
              <TwoLineItem title="Make" subtitle="BMW" />
            </Stack.Item>
            <Stack.Item grow={1}>
              <TwoLineItem title="Engine No." subtitle="21312312312312" />
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
      <Button
        color="green"
        appearance="primary"
        onClick={() => {
          onCreateWorkOrder();
        }}
      >
        Create Work Order
      </Button>
    </Panel>
  );
}
