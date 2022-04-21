import { assertSentryTransaction, getEnvelopeRequest, runServer } from '../../../utils';

test('should instrument GraphQL and Apollo Server.', async () => {
  const url = await runServer(__dirname);
  const envelope = await getEnvelopeRequest(url);

  expect(envelope).toHaveLength(3);

  const transaction = envelope[2];
  const parentSpanId = (transaction as any)?.contexts?.trace?.span_id;
  const graphqlSpanId = (transaction as any)?.spans?.[0].span_id;

  expect(parentSpanId).toBeDefined();
  expect(graphqlSpanId).toBeDefined();

  assertSentryTransaction(transaction, {
    transaction: 'test_transaction',
    spans: [
      {
        description: 'execute',
        op: 'db.graphql',
        parent_span_id: parentSpanId,
      },
      {
        description: 'Query.hello',
        op: 'db.graphql.apollo',
        parent_span_id: graphqlSpanId,
      },
    ],
  });
});