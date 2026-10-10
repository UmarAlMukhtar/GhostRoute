/** Keep initialization batches interruptible without adding delays to completed work. */
export async function cooperatively<T>(steps: Generator<void, T>): Promise<T> {
  for (let step = steps.next(); ; step = steps.next()) {
    if (step.done) return step.value;
    await new Promise<void>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
}
export function synchronously<T>(steps: Generator<void, T>): T {
  for (let step = steps.next(); ; step = steps.next())
    if (step.done) return step.value;
}
