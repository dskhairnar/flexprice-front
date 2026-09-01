import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import AuthService from '@/core/auth/AuthService';
import BrandTemplate from './BrandTemplate';
import { AuthTab } from './authTabs';
import { config } from '@/config/config';

const AuthPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [currentTab, setCurrentTab] = useState<AuthTab>(AuthTab.LOGIN);
	const signupEnabled = config.platform.signup.enabled;

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		if (searchParams.get('tab') === AuthTab.RESET_PASSWORD) return;
		const fetchUser = async () => {
			const tokenStr = await AuthService.getAcessToken();
			if (tokenStr) navigate('/');
		};
		fetchUser();
	}, [location.search, navigate]);

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const tab = searchParams.get('tab');

		if (tab === AuthTab.SIGNUP && !signupEnabled) {
			navigate('/auth', { replace: true });
			return;
		}

		if (tab === AuthTab.SIGNUP || tab === AuthTab.FORGOT_PASSWORD || tab === AuthTab.RESET_PASSWORD) {
			setCurrentTab(tab as AuthTab);
		} else {
			setCurrentTab(AuthTab.LOGIN);
		}
	}, [location, navigate, signupEnabled]);

	const switchTab = (tab: AuthTab) => {
		if (tab === AuthTab.SIGNUP && !signupEnabled) {
			navigate('/auth');
			return;
		}
		navigate(`/auth?tab=${tab}`);
	};

	return <BrandTemplate currentTab={currentTab} switchTab={switchTab} />;
};

export default AuthPage;
