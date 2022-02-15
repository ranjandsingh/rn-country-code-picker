import React from 'react';
import {
	FlatList,
	TextInput,
	View,
	Text,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Easing,
	Keyboard, TouchableOpacity,
} from 'react-native';
import {countryCodes} from '../constants/countryCodes';
import {CountryButton} from './CountryButton';
import {useKeyboardStatus} from '../helpers/useKeyboardStatus';

const height = Dimensions.get('window').height;

/**
 * Country picker component
 * @param {?boolean} show Hide or show component by using this props
 * @param {?boolean} disableBackdrop Hide or show component by using this props
 * @param {?boolean} enableModalAvoiding Is modal should avoid keyboard ? On android to work required to use with androidWindowSoftInputMode with value pan, by default android will avoid keyboard by itself
 * @param {?string} androidWindowSoftInputMode Hide or show component by using this props
 * @param {?string} inputPlaceholder Text to showing in input
 * @param {?string} searchMessage Text to show user when no country to show
 * @param {?string} lang Current selected lang bu user
 * @param {Function} pickerButtonOnPress Function to receive selected country
 * @param {Function} onBackdropPress Function to receive selected country
 * @param {?Object} style Styles
 * @param {?React.ReactNode} itemTemplate Country list template
 * @param rest
 */

export default function CountryPicker({
										  show,
										  pickerButtonOnPress,
										  inputPlaceholder,
										  searchMessage,
										  lang = 'en',
										  style,
										  enableModalAvoiding,
										  androidWindowSoftInputMode,
										  onBackdropPress,
										  disableBackdrop,
										  itemTemplate: ItemTemplate = CountryButton,
										  ...rest
									  }) {
	const keyboardStatus = useKeyboardStatus();
	const animationDriver = React.useRef(new Animated.Value(0)).current;
	const animatedMargin = React.useRef(new Animated.Value(0)).current;
	const [searchValue, setSearchValue] = React.useState('');
	const [visible, setVisible] = React.useState(show);

	React.useEffect(() => {
		if (show) {
			openModal();
		} else {
			closeModal();
		}
	}, [show]);

	React.useEffect(() => {
		if (
			enableModalAvoiding &&
			!!(
				keyboardStatus.keyboardPlatform === 'ios' ||
				(keyboardStatus.keyboardPlatform === 'android' &&
					androidWindowSoftInputMode === 'pan')
			)
		) {
			if (keyboardStatus.isOpen)
				Animated.timing(animatedMargin, {
					toValue: keyboardStatus.keyboardHeight,
					duration: 290,
					easing: Easing.ease,
					useNativeDriver: false,
				}).start();

			if (!keyboardStatus.isOpen)
				Animated.timing(animatedMargin, {
					toValue: 0,
					duration: 290,
					easing: Easing.ease,
					useNativeDriver: false,
				}).start();
		}
	}, [keyboardStatus.isOpen]);

	const resultCountries = React.useMemo(() => {
		if (!isNaN(searchValue))
			return countryCodes.filter((country) =>
				country?.dial_code.includes(searchValue)
			);

		return countryCodes.filter((country) =>
			country?.name[lang || 'en'].includes(searchValue)
		);
	}, [searchValue]);

	const modalPosition = animationDriver.interpolate({
		inputRange: [0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1],
		outputRange: [height, 105, 75, 50, 30, 15, 5, 0],
		extrapolate: 'clamp',
	});

	const modalBackdropFade = animationDriver.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [0, 0.5, 1],
		extrapolate: 'clamp'
	});

	const openModal = () => {
		setVisible(true);
		Animated.timing(animationDriver, {
			toValue: 1,
			duration: 400,
			useNativeDriver: false,
		}).start();
	};

	const closeModal = () => {
		Animated.timing(animationDriver, {
			toValue: 0,
			duration: 400,
			useNativeDriver: false,
		}).start(() => setVisible(false));
	};

	if (!visible)
		return null;

	return (
		<>
			{!disableBackdrop && (
				<Animated.View
					onStartShouldSetResponder={onBackdropPress}
					style={[
						{
							flex: 1,
							opacity: modalBackdropFade,
							backgroundColor: 'rgba(116,116,116,0.45)',
							position: 'absolute',
							width: '100%',
							height: '100%',
							justifyContent: 'flex-end'
						},
						style?.backdrop
					]}
				/>
			)}
			<Animated.View
				style={[
					styles.modal,
					style?.modal,
					{
						transform: [
							{
								translateY: modalPosition,
							},
						],
					},
				]}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<TextInput
						style={[styles.searchBar, style?.textInput]}
						value={searchValue}
						onChangeText={(text) => setSearchValue(text)}
						placeholder={inputPlaceholder || 'Search your country'}
						{...rest}
					/>
				</View>
				<View style={[styles.line, style?.line]}/>
				{resultCountries.length === 0 ? (
					<View style={[styles.countryMessage, style?.countryMessageContainer]}>
						<Text
							style={[
								{
									color: '#8c8c8c',
									fontSize: 16,
								},
								style?.searchMessageText,
							]}
						>
							{searchMessage || 'Sorry we cant find your country :('}
						</Text>
					</View>
				) : (
					<FlatList
						showsVerticalScrollIndicator={false}
						data={resultCountries || countryCodes}
						keyExtractor={(item, index) => item + index}
						initialNumToRender={10}
						maxToRenderPerBatch={10}
						style={[{
							height: 250
						}, style?.itemsList]}
						keyboardShouldPersistTaps={'handled'}
						renderItem={({item, index}) => {
							let itemName = item?.name[lang];
							let checkName = itemName.length ? itemName : item?.name['en'];

							return (
								<ItemTemplate
									key={index}
									item={item}
									style={style}
									name={checkName}
									onPress={() => {
										Keyboard.dismiss();
										typeof pickerButtonOnPress === 'function' && pickerButtonOnPress(item);
									}}
								/>
							);
						}}
						{...rest}
					/>
				)}
				<Animated.View
					style={[
						styles.modalInner,
						style?.modalInner,
						{
							height: animatedMargin,
						},
					]}
				/>
			</Animated.View>
		</>
	);
}

const styles = {
	container: {
		flex: 1,
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: 'flex-end',
	},
	modal: {
		backgroundColor: 'white',
		width: '100%',
		borderTopRightRadius: 15,
		borderTopLeftRadius: 15,
		padding: 10,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 6,
		},
		position: 'absolute',
		bottom: 0,
		zIndex: 10,
		shadowOpacity: 0.37,
		shadowRadius: 7.49,

		elevation: 10,
	},
	modalInner: {
		backgroundColor: 'white',
		width: '100%',
	},
	searchBar: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		borderRadius: 10,
		height: 40,
		padding: 5,
	},
	countryMessage: {
		justifyContent: 'center',
		alignItems: 'center',
		height: '100%',
	},
	line: {
		width: '100%',
		height: 1.5,
		borderRadius: 2,
		backgroundColor: '#eceff1',
		alignSelf: 'center',
		marginVertical: 5,
	},
};