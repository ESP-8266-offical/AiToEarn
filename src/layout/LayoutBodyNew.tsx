import { useUserStore } from '@/store/user';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import styles from './layoutBody.module.scss';
import { useAccountStore } from '../store/account';
import { sleep } from '../../commont/utils';
import { useBellMessageStroe } from '../store/bellMessageStroe';
import { message } from 'antd';

const LayoutBody = () => {
  const userStore = useUserStore();

  // 查询用户信息
  const queryUserInfo = async () => {
    let count = 0;
    while (true) {
      const res = await userStore.getUserInfo().catch(() => false);
      if (res || count >= 10) break;
      await sleep(1000);
      count++;
    }
  };

  useEffect(() => {
    useBellMessageStroe.getState().videoPublishProgressInit();
    
    // 免登录模式 - 显示提示信息
    if (!userStore.token) {
      message.success('已免登录，您可以直接使用所有功能', 2);
      // 可以设置一个默认的用户状态
      userStore.setToken({
        token: 'guest-mode',
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
        userInfo: {
          _id: 'guest',
          id: 'guest',
          name: '游客用户',
        },
      });
    } else {
      queryUserInfo();
    }
  }, []);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'KeyI') {
        event.preventDefault();
        window.ipcRenderer.invoke('OPEN_DEV_TOOLS', 'right');
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 鼠标跟随光效
  useEffect(() => {
    const lightElement = document.createElement('div');
    lightElement.className = 'mouse-light-effect';
    document.body.appendChild(lightElement);

    const handleMouseMove = (e: MouseEvent) => {
      lightElement.style.left = e.clientX + 'px';
      lightElement.style.top = e.clientY + 'px';
      lightElement.classList.add('active');
    };

    const handleMouseLeave = () => {
      lightElement.classList.remove('active');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (document.body.contains(lightElement)) {
        document.body.removeChild(lightElement);
      }
    };
  }, []);

  useEffect(() => {
    // 免登录模式下也初始化账户状态
    useAccountStore.getState().init();
  }, [userStore.token]);

  // 移除登录检查，直接渲染主界面
  return (
    <div className={styles.layoutBody}>
      <Navigation />
      <main className="layoutBody-main">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutBody;
