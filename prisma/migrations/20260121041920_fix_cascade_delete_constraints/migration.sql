-- DropForeignKey
ALTER TABLE "intakes" DROP CONSTRAINT "intakes_assigned_preparer_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "preparer_packet_requests" DROP CONSTRAINT "preparer_packet_requests_requested_by_id_fkey";

-- AddForeignKey
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_assigned_preparer_id_fkey" FOREIGN KEY ("assigned_preparer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparer_packet_requests" ADD CONSTRAINT "preparer_packet_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
