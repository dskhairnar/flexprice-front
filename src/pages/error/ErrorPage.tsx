import { Button, Spacer } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
	variant?: 'notFound' | 'forbidden';
}

const ErrorPage: React.FC<ErrorPageProps> = ({ variant = 'notFound' }) => {
	const { t } = useTranslation('common');
	const isForbidden = variant === 'forbidden';
	return (
		<div className='h-screen w-full flex justify-center items-center'>
			<div className='w-full flex flex-col items-center '>
				<TriangleAlert className='size-28' />
				<p className='font-sans text-2xl font-bold'>{t(isForbidden ? 'errorPage.forbiddenTitle' : 'errorPage.notFoundTitle')}</p>
				<p className='text-content-zinc-muted font-normal '>
					{t(isForbidden ? 'errorPage.forbiddenSubtitle' : 'errorPage.notFoundSubtitle')}
				</p>
				<Spacer height={'16px'} />
				<Link to={RouteNames.home}>
					<Button>
						<span>{t('errorPage.notFoundBackToHome')}</span>
					</Button>
				</Link>
			</div>
		</div>
	);
};

export default ErrorPage;
