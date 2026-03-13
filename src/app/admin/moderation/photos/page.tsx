import { redirect } from 'next/navigation';
import { PhotosClient } from './PhotosClient';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export default async function PhotosPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  return <PhotosClient />;
}
